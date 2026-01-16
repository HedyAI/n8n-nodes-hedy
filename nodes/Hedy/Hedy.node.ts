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

			// Session ID for todos
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['todo'],
						operation: ['getBySession'],
					},
				},
				default: '',
				description: 'The ID of the session to get todos for',
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

			// Topic ID parameter for get operation
			{
				displayName: 'Topic ID',
				name: 'topicId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['topic'],
						operation: ['get', 'getSessions'],
					},
				},
				default: '',
				description: 'The ID of the topic',
				placeholder: 'topic_abc123',
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
						// Create a new session context
						const title = this.getNodeParameter('title', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						if (!title) {
							throw new NodeOperationError(this.getNode(), 'Title is required');
						}

						const body: IDataObject = { title };

						// Only include fields that are explicitly set
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
						// Delete a session context
						const contextId = this.getNodeParameter('contextId', i) as string;

						if (!contextId) {
							throw new NodeOperationError(this.getNode(), 'Context ID is required');
						}

						responseData = await hedyApiRequest.call(
							this,
							'DELETE',
							`/contexts/${contextId}`,
						);

						// API returns { success: true, message: "..." }
						// Ensure we have a valid response for n8n item pairing
						if (!responseData) {
							responseData = { success: true, deleted: true };
						}
					} else if (operation === 'get') {
						// Get a specific session context
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
						// Get all session contexts
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						// Note: The contexts endpoint doesn't support server-side pagination
						// We always fetch all contexts and then slice client-side if needed
						responseData = await hedyApiRequest.call(
							this,
							'GET',
							'/contexts',
						);

						// Handle response format
						if (responseData && typeof responseData === 'object' && 'data' in responseData) {
							responseData = responseData.data;
						}

						// Apply client-side limit if not returning all
						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							if (Array.isArray(responseData) && responseData.length > limit) {
								responseData = responseData.slice(0, limit);
							}
						}
					} else if (operation === 'update') {
						// Update a session context
						const contextId = this.getNodeParameter('contextId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

						if (!contextId) {
							throw new NodeOperationError(this.getNode(), 'Context ID is required');
						}

						// Build the update body with only explicitly set fields
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

						// Guard against empty update
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
						// Get single session
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
						// Get multiple sessions
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

							// Handle pagination response
							if (responseData && typeof responseData === 'object' && 'data' in responseData) {
								responseData = responseData.data;
							}
						}
					}
				} else if (resource === 'highlight') {
					// Highlight operations
					if (operation === 'get') {
						// Get single highlight
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
						// Get multiple highlights
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

							// Handle pagination response
							if (responseData && typeof responseData === 'object' && 'data' in responseData) {
								responseData = responseData.data;
							}
						}
					}
				} else if (resource === 'todo') {
					// Todo operations
					if (operation === 'getAll') {
						// Get all todos
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						// Note: The todos endpoint returns all todos as a flat array
						// and doesn't support server-side pagination
						responseData = await hedyApiRequest.call(
							this,
							'GET',
							'/todos',
						);

						// Apply client-side limit if not returning all
						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							if (Array.isArray(responseData) && responseData.length > limit) {
								responseData = responseData.slice(0, limit);
							}
						}
					} else if (operation === 'getBySession') {
						// Get todos by session
						const sessionId = this.getNodeParameter('sessionId', i) as string;
						
						if (!sessionId) {
							throw new NodeOperationError(this.getNode(), 'Session ID is required');
						}

						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						// Note: The session todos endpoint doesn't support server-side pagination
						// We always fetch all todos for the session and slice client-side if needed
						responseData = await hedyApiRequest.call(
							this,
							'GET',
							`/sessions/${sessionId}/todos`,
						);

						// Handle response format
						if (responseData && typeof responseData === 'object' && 'data' in responseData) {
							responseData = responseData.data;
						}

						// Apply client-side limit if not returning all
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
						// Get a specific topic
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
						// Get all topics
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						// Note: The topics endpoint doesn't support server-side pagination
						// We always fetch all topics and then slice client-side if needed
						responseData = await hedyApiRequest.call(
							this,
							'GET',
							'/topics',
						);

						// Handle response format
						if (responseData && typeof responseData === 'object' && 'data' in responseData) {
							responseData = responseData.data;
						}

						// Apply client-side limit if not returning all
						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							if (Array.isArray(responseData) && responseData.length > limit) {
								responseData = responseData.slice(0, limit);
							}
						}
					} else if (operation === 'getSessions') {
						// Get sessions for a specific topic
						const topicId = this.getNodeParameter('topicId', i) as string;
						
						if (!topicId) {
							throw new NodeOperationError(this.getNode(), 'Topic ID is required');
						}

						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						// Note: The topic sessions endpoint doesn't support server-side pagination
						// We always fetch all sessions for the topic and slice client-side if needed
						responseData = await hedyApiRequest.call(
							this,
							'GET',
							`/topics/${topicId}/sessions`,
						);

						// Handle response format
						if (responseData && typeof responseData === 'object' && 'data' in responseData) {
							responseData = responseData.data;
						}

						// Apply client-side limit if not returning all
						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							if (Array.isArray(responseData) && responseData.length > limit) {
								responseData = responseData.slice(0, limit);
							}
						}
					}
				}

				// Process response data
				if (Array.isArray(responseData)) {
					returnData.push(...responseData.map(item => ({
						json: item,
						pairedItem: { item: i }
					})));
				} else if (responseData !== undefined) {
					returnData.push({
						json: responseData,
						pairedItem: { item: i }
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