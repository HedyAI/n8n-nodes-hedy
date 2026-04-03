import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

import {
	hedyApiRequest,
	hedyApiRequestAllItems,
} from './GenericFunctions';

// Type imports are available but not used directly in runtime

/**
 * Add backward-compatible field aliases to API response data.
 * Detects payload shape rather than relying on resource name, so it works
 * for nested objects too (e.g. sessions inside topic.getSessions, highlights inside session detail).
 */
function normalizeResponseData(data: IDataObject, _resource?: string): IDataObject {
	// Highlight normalization (by shape: has highlightId or aiInsight)
	if (data.highlightId !== undefined && data.id === undefined) {
		data.id = data.highlightId;
	}
	if (data.aiInsight !== undefined && data.aiInsights === undefined) {
		data.aiInsights = data.aiInsight;
	}
	// Session normalization (by shape: has sessionId and startTime — distinguishes from highlights which also have sessionId)
	if (data.sessionId !== undefined && data.startTime !== undefined && data.id === undefined) {
		data.id = data.sessionId;
	}
	// Recurse into embedded highlights array
	if (Array.isArray(data.highlights)) {
		for (const highlight of data.highlights) {
			if (highlight && typeof highlight === 'object') {
				normalizeResponseData(highlight as IDataObject);
			}
		}
	}
	return data;
}

export class Hedy implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hedy',
		name: 'hedy',
		icon: 'file:hedy.png',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with Hedy API to retrieve meeting intelligence data',
		defaults: {
			name: 'Hedy',
		},
		inputs: [{type: NodeConnectionType.Main}],
		outputs: [{type: NodeConnectionType.Main}],
		credentials: [
			{
				name: 'hedyApi',
				required: true,
			},
		],
		properties: [
			// Resource selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'session',
				required: true,
				options: [
					{
						name: 'Context',
						value: 'context',
						description: 'Session context operations for AI instructions',
					},
					{
						name: 'Highlight',
						value: 'highlight',
						description: 'Meeting highlight operations',
					},
					{
						name: 'Session',
						value: 'session',
						description: 'Meeting session operations',
					},
					{
						name: 'Todo',
						value: 'todo',
						description: 'Todo item operations',
					},
					{
						name: 'Topic',
						value: 'topic',
						description: 'Topic operations for organizing sessions',
					},
				],
			},

			// Context operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['context'],
					},
				},
				default: 'getAll',
				required: true,
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new session context',
						action: 'Create a session context',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a session context',
						action: 'Delete a session context',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a specific session context by ID',
						action: 'Get a session context',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get all session contexts',
						action: 'Get many session contexts',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a session context',
						action: 'Update a session context',
					},
				],
			},

			// Session operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['session'],
					},
				},
				default: 'get',
				required: true,
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a specific session by ID',
						action: 'Get a session',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get multiple sessions',
						action: 'Get many sessions',
					},
				],
			},

			// Highlight operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['highlight'],
					},
				},
				default: 'get',
				required: true,
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a specific highlight by ID',
						action: 'Get a highlight',
					},
					{
						name: 'Get by Session',
						value: 'getBySession',
						description: 'Get highlights for a specific session',
						action: 'Get highlights by session',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get multiple highlights',
						action: 'Get many highlights',
					},
				],
			},

			// Todo operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['todo'],
					},
				},
				default: 'getAll',
				required: true,
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a specific todo by ID',
						action: 'Get a todo',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get all todos',
						action: 'Get many todos',
					},
					{
						name: 'Get by Session',
						value: 'getBySession',
						description: 'Get todos for a specific session',
						action: 'Get todos by session',
					},
				],
			},

			// Topic operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['topic'],
					},
				},
				default: 'get',
				required: true,
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new topic',
						action: 'Create a topic',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a topic',
						action: 'Delete a topic',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a specific topic by ID',
						action: 'Get a topic',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get all topics',
						action: 'Get many topics',
					},
					{
						name: 'Get Topic Sessions',
						value: 'getSessions',
						description: 'Get all sessions for a specific topic',
						action: 'Get sessions by topic',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a topic',
						action: 'Update a topic',
					},
				],
			},

			// Session ID parameter
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The ID of the session to retrieve',
				placeholder: 'sess_abc123',
			},

			// Session ID for todo get and getBySession
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['todo'],
						operation: ['get', 'getBySession'],
					},
				},
				default: '',
				description: 'The ID of the session',
				placeholder: 'sess_abc123',
			},

			// Todo ID for todo get
			{
				displayName: 'Todo ID',
				name: 'todoId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['todo'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The ID of the todo to retrieve',
				placeholder: 'todo_abc123',
			},

			// Session ID for highlight getBySession
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['highlight'],
						operation: ['getBySession'],
					},
				},
				default: '',
				description: 'The ID of the session to get highlights for',
				placeholder: 'sess_abc123',
			},

			// Highlight ID parameter
			{
				displayName: 'Highlight ID',
				name: 'highlightId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['highlight'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The ID of the highlight to retrieve',
				placeholder: 'high_xyz789',
			},

			// Topic ID parameter for get, update, delete, getSessions
			{
				displayName: 'Topic ID',
				name: 'topicId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['topic'],
						operation: ['get', 'update', 'delete', 'getSessions'],
					},
				},
				default: '',
				description: 'The ID of the topic',
				placeholder: 'topic_abc123',
			},

			// Topic Name parameter for create
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['topic'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Name of the topic (max 100 characters)',
				placeholder: 'Weekly Standups',
			},

			// Context ID parameter for get, update, delete operations
			{
				displayName: 'Context ID',
				name: 'contextId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['context'],
						operation: ['get', 'update', 'delete'],
					},
				},
				default: '',
				description: 'The ID of the session context',
				placeholder: 'ctx_abc123',
			},

			// Title parameter for context create
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['context'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Title of the session context (max 200 characters)',
				placeholder: 'Sales Calls',
			},

			// Additional fields for context create
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['context'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						typeOptions: {
							rows: 5,
						},
						default: '',
						description: 'Instructions or context for AI analysis (max 20,000 characters)',
					},
					{
						displayName: 'Is Default',
						name: 'isDefault',
						type: 'boolean',
						default: false,
						description: 'Whether this context should be the default for new sessions',
					},
				],
			},

			// Update fields for context update
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['context'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Title of the session context (max 200 characters)',
					},
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						typeOptions: {
							rows: 5,
						},
						default: '',
						description: 'Instructions or context for AI analysis (max 20,000 characters)',
					},
					{
						displayName: 'Is Default',
						name: 'isDefault',
						type: 'boolean',
						default: false,
						description: 'Whether this context should be the default for new sessions',
					},
				],
			},

			// Additional fields for topic create
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['topic'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Color',
						name: 'color',
						type: 'string',
						default: '',
						description: 'Hex color code for the topic',
						placeholder: '#4A90D9',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Description of the topic (max 500 characters)',
					},
					{
						displayName: 'Icon Name',
						name: 'iconName',
						type: 'string',
						default: '',
						description: 'Material icon name',
						placeholder: 'groups',
					},
					{
						displayName: 'Topic Context',
						name: 'topicContext',
						type: 'string',
						typeOptions: {
							rows: 5,
						},
						default: '',
						description: 'Custom instructions for AI processing of sessions in this topic (max 20,000 characters)',
					},
				],
			},

			// Update fields for topic update
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['topic'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Color',
						name: 'color',
						type: 'string',
						default: '',
						description: 'Hex color code for the topic',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Description of the topic (max 500 characters)',
					},
					{
						displayName: 'Icon Name',
						name: 'iconName',
						type: 'string',
						default: '',
						description: 'Material icon name',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Name of the topic (max 100 characters)',
					},
					{
						displayName: 'Topic Context',
						name: 'topicContext',
						type: 'string',
						typeOptions: {
							rows: 5,
						},
						default: '',
						description: 'Custom instructions for AI processing (max 20,000 characters). Leave empty to clear.',
					},
				],
			},

			// Return All parameter
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['context', 'session', 'highlight', 'todo', 'topic'],
						operation: ['getAll', 'getBySession', 'getSessions'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},

			// Limit parameter
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['context', 'session', 'highlight', 'todo', 'topic'],
						operation: ['getAll', 'getBySession', 'getSessions'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 50,
				description: 'Max number of results to return',
			},

			// Additional options
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['session', 'highlight'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Format',
						name: 'format',
						type: 'options',
						default: 'standard',
						description: 'Response format to use',
						options: [
							{
								name: 'Standard',
								value: 'standard',
								description: 'Standard API format with pagination',
							},
							{
								name: 'Zapier',
								value: 'zapier',
								description: 'Zapier-compatible flat array format',
							},
						],
					},
					{
						displayName: 'Topic ID',
						name: 'topicId',
						type: 'string',
						default: '',
						description: 'Filter by topic ID',
						placeholder: 'topic_123xyz',
					},
					{
						displayName: 'After',
						name: 'after',
						type: 'string',
						default: '',
						description: 'Cursor for pagination (get results after this cursor)',
					},
					{
						displayName: 'Before',
						name: 'before',
						type: 'string',
						default: '',
						description: 'Cursor for pagination (get results before this cursor)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				if (resource === 'context') {
					// Context operations
					if (operation === 'create') {
						const title = this.getNodeParameter('title', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						if (!title) {
							throw new NodeOperationError(this.getNode(), 'Title is required');
						}

						const body: IDataObject = { title };

						if (additionalFields.content !== undefined && additionalFields.content !== '') {
							body.content = additionalFields.content;
						}
						if (additionalFields.isDefault !== undefined) {
							body.isDefault = additionalFields.isDefault;
						}

						responseData = await hedyApiRequest.call(
							this,
							'POST',
							'/contexts',
							body,
						);
					} else if (operation === 'delete') {
						const contextId = this.getNodeParameter('contextId', i) as string;

						if (!contextId) {
							throw new NodeOperationError(this.getNode(), 'Context ID is required');
						}

						responseData = await hedyApiRequest.call(
							this,
							'DELETE',
							`/contexts/${contextId}`,
						);

						if (!responseData) {
							responseData = { success: true, deleted: true };
						}
					} else if (operation === 'get') {
						const contextId = this.getNodeParameter('contextId', i) as string;

						if (!contextId) {
							throw new NodeOperationError(this.getNode(), 'Context ID is required');
						}

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							`/contexts/${contextId}`,
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							'/contexts',
						);

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							if (Array.isArray(responseData) && responseData.length > limit) {
								responseData = responseData.slice(0, limit);
							}
						}
					} else if (operation === 'update') {
						const contextId = this.getNodeParameter('contextId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

						if (!contextId) {
							throw new NodeOperationError(this.getNode(), 'Context ID is required');
						}

						const body: IDataObject = {};

						if (updateFields.title !== undefined && updateFields.title !== '') {
							body.title = updateFields.title;
						}
						if (updateFields.content !== undefined) {
							body.content = updateFields.content;
						}
						if (updateFields.isDefault !== undefined) {
							body.isDefault = updateFields.isDefault;
						}

						if (Object.keys(body).length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'At least one field must be set for update. Add a field in Update Fields.',
							);
						}

						responseData = await hedyApiRequest.call(
							this,
							'PATCH',
							`/contexts/${contextId}`,
							body,
						);
					}
				} else if (resource === 'session') {
					// Session operations
					if (operation === 'get') {
						const sessionId = this.getNodeParameter('sessionId', i) as string;

						if (!sessionId) {
							throw new NodeOperationError(this.getNode(), 'Session ID is required');
						}

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							`/sessions/${sessionId}`,
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const options = this.getNodeParameter('options', i, {}) as IDataObject;

						if (returnAll) {
							responseData = await hedyApiRequestAllItems.call(
								this,
								'/sessions',
								options,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const qs: IDataObject = {
								limit,
								...options,
							};

							responseData = await hedyApiRequest.call(
								this,
								'GET',
								'/sessions',
								undefined,
								qs,
							);

						}
					}
				} else if (resource === 'highlight') {
					// Highlight operations
					if (operation === 'get') {
						const highlightId = this.getNodeParameter('highlightId', i) as string;

						if (!highlightId) {
							throw new NodeOperationError(this.getNode(), 'Highlight ID is required');
						}

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							`/highlights/${highlightId}`,
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const options = this.getNodeParameter('options', i, {}) as IDataObject;

						if (returnAll) {
							responseData = await hedyApiRequestAllItems.call(
								this,
								'/highlights',
								options,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const qs: IDataObject = {
								limit,
								...options,
							};

							responseData = await hedyApiRequest.call(
								this,
								'GET',
								'/highlights',
								undefined,
								qs,
							);

						}
					} else if (operation === 'getBySession') {
						const sessionId = this.getNodeParameter('sessionId', i) as string;

						if (!sessionId) {
							throw new NodeOperationError(this.getNode(), 'Session ID is required');
						}

						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							`/sessions/${sessionId}/highlights`,
						);

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							if (Array.isArray(responseData) && responseData.length > limit) {
								responseData = responseData.slice(0, limit);
							}
						}
					}
				} else if (resource === 'todo') {
					// Todo operations
					if (operation === 'get') {
						const sessionId = this.getNodeParameter('sessionId', i) as string;
						const todoId = this.getNodeParameter('todoId', i) as string;

						if (!sessionId) {
							throw new NodeOperationError(this.getNode(), 'Session ID is required');
						}
						if (!todoId) {
							throw new NodeOperationError(this.getNode(), 'Todo ID is required');
						}

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							`/sessions/${sessionId}/todos/${todoId}`,
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							'/todos',
						);

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							if (Array.isArray(responseData) && responseData.length > limit) {
								responseData = responseData.slice(0, limit);
							}
						}
					} else if (operation === 'getBySession') {
						const sessionId = this.getNodeParameter('sessionId', i) as string;

						if (!sessionId) {
							throw new NodeOperationError(this.getNode(), 'Session ID is required');
						}

						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							`/sessions/${sessionId}/todos`,
						);

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							if (Array.isArray(responseData) && responseData.length > limit) {
								responseData = responseData.slice(0, limit);
							}
						}
					}
				} else if (resource === 'topic') {
					// Topic operations
					if (operation === 'get') {
						const topicId = this.getNodeParameter('topicId', i) as string;

						if (!topicId) {
							throw new NodeOperationError(this.getNode(), 'Topic ID is required');
						}

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							`/topics/${topicId}`,
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						responseData = await hedyApiRequest.call(
							this,
							'GET',
							'/topics',
						);

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							if (Array.isArray(responseData) && responseData.length > limit) {
								responseData = responseData.slice(0, limit);
							}
						}
					} else if (operation === 'getSessions') {
						// Server-side pagination with startAfter cursor
						const topicId = this.getNodeParameter('topicId', i) as string;

						if (!topicId) {
							throw new NodeOperationError(this.getNode(), 'Topic ID is required');
						}

						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						if (returnAll) {
							const allSessions: any[] = [];
							let hasMore = true;
							let startAfter: string | undefined;

							while (hasMore) {
								const qs: IDataObject = { limit: 50 };
								if (startAfter) {
									qs.startAfter = startAfter;
								}

								// raw=true returns { success, data: { sessions, pagination } }
								const response = await hedyApiRequest.call(
									this,
									'GET',
									`/topics/${topicId}/sessions`,
									undefined,
									qs,
									true,
								);

								const page = response?.data ?? response;
								const sessions = page?.sessions || [];
								if (Array.isArray(sessions)) {
									allSessions.push(...sessions);
								}

								hasMore = page?.pagination?.hasMore || false;
								startAfter = page?.pagination?.nextCursor;

								if (allSessions.length >= 1000) break;
							}

							responseData = allSessions;
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const qs: IDataObject = { limit };

							const response = await hedyApiRequest.call(
								this,
								'GET',
								`/topics/${topicId}/sessions`,
								undefined,
								qs,
								true,
							);

							const page = response?.data ?? response;
							responseData = page?.sessions || [];
							if (!Array.isArray(responseData)) {
								responseData = [];
							}
						}
					} else if (operation === 'create') {
						const name = this.getNodeParameter('name', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						if (!name) {
							throw new NodeOperationError(this.getNode(), 'Name is required');
						}

						const body: IDataObject = { name };

						if (additionalFields.description !== undefined && additionalFields.description !== '') {
							body.description = additionalFields.description;
						}
						if (additionalFields.color !== undefined && additionalFields.color !== '') {
							body.color = additionalFields.color;
						}
						if (additionalFields.iconName !== undefined && additionalFields.iconName !== '') {
							body.iconName = additionalFields.iconName;
						}
						if (additionalFields.topicContext !== undefined && additionalFields.topicContext !== '') {
							body.topicContext = additionalFields.topicContext;
						}

						responseData = await hedyApiRequest.call(
							this,
							'POST',
							'/topics',
							body,
						);
					} else if (operation === 'update') {
						const topicId = this.getNodeParameter('topicId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

						if (!topicId) {
							throw new NodeOperationError(this.getNode(), 'Topic ID is required');
						}

						const body: IDataObject = {};

						if (updateFields.name !== undefined && updateFields.name !== '') {
							body.name = updateFields.name;
						}
						if (updateFields.description !== undefined) {
							body.description = updateFields.description;
						}
						if (updateFields.color !== undefined && updateFields.color !== '') {
							body.color = updateFields.color;
						}
						if (updateFields.iconName !== undefined && updateFields.iconName !== '') {
							body.iconName = updateFields.iconName;
						}
						if (updateFields.topicContext !== undefined) {
							// Empty string means clear (send null to API)
							body.topicContext = updateFields.topicContext === '' ? null : updateFields.topicContext;
						}

						if (Object.keys(body).length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'At least one field must be set for update. Add a field in Update Fields.',
							);
						}

						responseData = await hedyApiRequest.call(
							this,
							'PATCH',
							`/topics/${topicId}`,
							body,
						);
					} else if (operation === 'delete') {
						const topicId = this.getNodeParameter('topicId', i) as string;

						if (!topicId) {
							throw new NodeOperationError(this.getNode(), 'Topic ID is required');
						}

						responseData = await hedyApiRequest.call(
							this,
							'DELETE',
							`/topics/${topicId}`,
						);

						if (!responseData) {
							responseData = { success: true, deleted: true };
						}
					}
				}

				// Process response data with backward-compat normalization
				if (Array.isArray(responseData)) {
					returnData.push(...responseData.map(item => ({
						json: normalizeResponseData(item as IDataObject),
						pairedItem: { item: i },
					})));
				} else if (responseData !== undefined) {
					returnData.push({
						json: normalizeResponseData(responseData as IDataObject),
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
