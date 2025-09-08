import {
	IExecuteFunctions,
	IWebhookFunctions,
	IDataObject,
	IHttpRequestOptions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import { createHmac } from 'crypto';
import { WebhookConfig, ErrorCode } from './types';

export async function hedyApiRequest(
	this: IExecuteFunctions | IWebhookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<any> {
	const credentials = await this.getCredentials('hedyApi');
	
	if (!credentials?.apiKey) {
		throw new NodeOperationError(this.getNode(), 'No API key provided');
	}

	const options: IHttpRequestOptions = {
		method,
		url: `https://api.hedy.bot${endpoint}`,
		headers: {
			'Authorization': `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
			'User-Agent': 'n8n-nodes-hedy/1.0.0',
		},
		qs,
		body,
		json: true,
		returnFullResponse: false,
	};

	// Add Zapier format support if requested
	if (qs?.format === 'zapier') {
		options.qs = { ...qs, format: 'zapier' };
	}

	try {
		const response = await this.helpers.httpRequest(options);
		
		// Handle API response format
		if (response && typeof response === 'object') {
			if ('success' in response && !response.success) {
				throw new NodeApiError(this.getNode(), response as any);
			}
			if ('data' in response) {
				return response.data;
			}
		}
		
		return response;
	} catch (error) {
		if (error instanceof NodeApiError || error instanceof NodeOperationError) {
			throw error;
		}

		// Handle specific error codes
		if (error && typeof error === 'object' && 'error' in error) {
			const apiError = error as any;
			const errorCode = apiError.error?.code || 'unknown_error';
			const errorMessage = apiError.error?.message || 'An unknown error occurred';

			// Provide user-friendly error messages
			switch (errorCode) {
				case ErrorCode.WebhookLimitExceeded:
					throw new NodeOperationError(
						this.getNode(),
						'Maximum webhook limit reached (10). Please delete unused webhooks in your Hedy dashboard.',
					);
				case ErrorCode.AuthenticationFailed:
					throw new NodeOperationError(
						this.getNode(),
						'Invalid API key. Please check your Hedy dashboard for the correct API key.',
					);
				case ErrorCode.InvalidEvent:
					throw new NodeOperationError(
						this.getNode(),
						'Invalid event type. Valid events: session.created, session.ended, highlight.created, todo.exported',
					);
				default:
					throw new NodeOperationError(this.getNode(), errorMessage);
			}
		}

		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function hedyApiRequestAllItems(
	this: IExecuteFunctions,
	endpoint: string,
	qs: IDataObject = {},
): Promise<any[]> {
	const returnData: any[] = [];
	let hasMore = true;
	let cursor: string | undefined;

	// Set default limit if not specified
	if (!qs.limit) {
		qs.limit = 50;
	}

	while (hasMore) {
		if (cursor) {
			qs.after = cursor;
		}

		const response = await hedyApiRequest.call(this, 'GET', endpoint, undefined, qs);

		if (Array.isArray(response)) {
			// Zapier format - flat array
			returnData.push(...response);
			hasMore = false; // Zapier format doesn't support pagination
		} else if (response && typeof response === 'object' && 'data' in response) {
			// Standard format with pagination
			returnData.push(...response.data);
			
			if (response.pagination) {
				hasMore = response.pagination.hasMore || false;
				cursor = response.pagination.next;
			} else {
				hasMore = false;
			}
		} else {
			// Unknown format, return as is
			if (response) {
				returnData.push(response);
			}
			hasMore = false;
		}

		// Safety check to prevent infinite loops
		if (returnData.length >= 1000) {
			console.warn('Reached maximum item limit of 1000');
			break;
		}
	}

	return returnData;
}

export function verifyWebhookSignature(
	body: string,
	signature: string,
	secret: string,
): boolean {
	const expectedSignature = createHmac('sha256', secret)
		.update(body)
		.digest('hex');
	
	// Constant-time comparison to prevent timing attacks
	if (signature.length !== expectedSignature.length) {
		return false;
	}
	
	let result = 0;
	for (let i = 0; i < signature.length; i++) {
		result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
	}
	
	return result === 0;
}

export async function registerWebhook(
	this: IWebhookFunctions,
	webhookUrl: string,
	events: string[],
): Promise<WebhookConfig> {
	const webhookData = {
		url: webhookUrl,
		events,
	};

	const response = await hedyApiRequest.call(
		this,
		'POST',
		'/webhooks',
		webhookData,
	);

	return response as WebhookConfig;
}

export async function unregisterWebhook(
	this: IWebhookFunctions,
	webhookId: string,
): Promise<void> {
	try {
		await hedyApiRequest.call(
			this,
			'DELETE',
			`/webhooks/${webhookId}`,
		);
	} catch (error) {
		// Ignore errors when deleting webhooks (webhook might already be deleted)
		console.warn(`Failed to delete webhook ${webhookId}:`, error);
	}
}

export function parseApiError(error: any): { code: string; message: string } {
	if (error && typeof error === 'object') {
		if ('error' in error && typeof error.error === 'object') {
			return {
				code: error.error.code || 'unknown_error',
				message: error.error.message || 'An unknown error occurred',
			};
		}
		if ('message' in error) {
			return {
				code: 'error',
				message: error.message,
			};
		}
	}
	
	return {
		code: 'unknown_error',
		message: 'An unknown error occurred',
	};
}