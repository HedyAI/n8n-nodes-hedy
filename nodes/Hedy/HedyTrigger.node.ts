import {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

import {
	registerWebhook,
	unregisterWebhook,
	verifyWebhookSignature,
} from './GenericFunctions';

import { WebhookEvent } from './types';

export class HedyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hedy Trigger',
		name: 'hedyTrigger',
		icon: 'file:hedy.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers when events happen in Hedy',
		defaults: {
			name: 'Hedy Trigger',
		},
		inputs: [],
		outputs: [{type: NodeConnectionType.Main}],
		credentials: [
			{
				name: 'hedyApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Trigger Event',
				name: 'event',
				type: 'options',
				required: true,
				default: WebhookEvent.SessionEnded,
				description: 'The event that will trigger this workflow',
				options: [
					{
						name: 'Session Created',
						value: WebhookEvent.SessionCreated,
						description: 'Triggers when a new session is created',
					},
					{
						name: 'Session Ended',
						value: WebhookEvent.SessionEnded,
						description: 'Triggers when a session ends (equivalent to Zapier\'s "Session Completed")',
					},
					{
						name: 'Highlight Created',
						value: WebhookEvent.HighlightCreated,
						description: 'Triggers when a new highlight is created during a session',
					},
					{
						name: 'Todo Exported',
						value: WebhookEvent.TodoExported,
						description: 'Triggers when a todo item is exported',
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Verify Signature',
						name: 'verifySignature',
						type: 'boolean',
						default: true,
						description: 'Whether to verify the webhook signature for security. Recommended to keep enabled.',
					},
				],
			},
		],
	};

	// @ts-ignore
	webhookMethods = {
		default: {
			async checkExists(this: IWebhookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId) {
					// Webhook exists
					return true;
				}
				return false;
			},

			async create(this: IWebhookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;

				if (!webhookUrl || !webhookUrl.startsWith('https://')) {
					throw new NodeOperationError(
						this.getNode(),
						'Webhook URL must use HTTPS for security. Please ensure your n8n instance is configured with HTTPS.',
					);
				}

				try {
					// Register webhook with Hedy API
					const webhook = await registerWebhook.call(
						this,
						webhookUrl,
						[event], // API expects array of events
					);

					if (!webhook || !webhook.id) {
						throw new NodeOperationError(
							this.getNode(),
							'Failed to register webhook - no webhook ID returned',
						);
					}

					// Store webhook data for deletion
					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookId = webhook.id;
					webhookData.signingSecret = webhook.signingSecret || '';
					webhookData.event = event;

					return true;
				} catch (error) {
					if (error instanceof NodeOperationError) {
						throw error;
					}

					// Parse and handle specific errors
					const errorMessage = (error as any)?.message || 'Failed to register webhook';
					const errorCode = (error as any)?.error?.code;

					if (errorCode === 'webhook_limit_exceeded') {
						throw new NodeOperationError(
							this.getNode(),
							'Maximum webhook limit reached (10). Please delete unused webhooks in your Hedy dashboard or by deactivating other workflows.',
						);
					}

					throw new NodeOperationError(this.getNode(), errorMessage);
				}
			},

			async delete(this: IWebhookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				
				if (webhookData.webhookId) {
					try {
						await unregisterWebhook.call(this, webhookData.webhookId as string);
					} catch (error) {
						// Log but don't throw - webhook might already be deleted
						console.warn(`Failed to delete webhook ${webhookData.webhookId}:`, error);
					}
					
					// Clear stored data
					delete webhookData.webhookId;
					delete webhookData.signingSecret;
					delete webhookData.event;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const headers = this.getHeaderData() as IDataObject;
		const bodyData = this.getBodyData();
		const options = this.getNodeParameter('options', {}) as IDataObject;

		// Verify webhook signature if enabled
		if (options.verifySignature !== false) {
			const signature = headers['x-hedy-signature'] as string;
			
			if (!signature) {
				throw new NodeOperationError(
					this.getNode(),
					'No signature found in webhook headers. This webhook might not be from Hedy.',
				);
			}

			const webhookData = this.getWorkflowStaticData('node');
			const signingSecret = webhookData.signingSecret as string;

			if (!signingSecret) {
				throw new NodeOperationError(
					this.getNode(),
					'No signing secret found. Please reactivate this workflow to register the webhook properly.',
				);
			}

			// Get raw body for signature verification
			const rawBody = req.rawBody || JSON.stringify(bodyData);
			const isValid = verifyWebhookSignature(rawBody, signature, signingSecret);

			if (!isValid) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid webhook signature. This request might not be from Hedy.',
				);
			}
		}

		// Parse the webhook payload
		const webhookPayload = bodyData as IDataObject;

		// Extract event type from payload
		const eventType = webhookPayload.event as string;
		const expectedEvent = this.getNodeParameter('event') as string;

		// Verify this is the expected event type
		if (eventType && eventType !== expectedEvent) {
			console.warn(`Received unexpected event type: ${eventType}, expected: ${expectedEvent}`);
			// Still process it but log the warning
		}

		// Return the webhook data
		return {
			workflowData: [
				this.helpers.returnJsonArray(webhookPayload),
			],
		};
	}
}