import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class HedyApi implements ICredentialType {
	name = 'hedyApi';
	displayName = 'Hedy';
	documentationUrl = 'https://api.hedy.bot/docs';
	// Removed httpRequestNode to prevent generic HTTP Request node from appearing
	// Users should use the dedicated Hedy node for all operations
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Hedy API key for authentication. Get it from your Hedy dashboard at Settings → API → Generate New Key.',
			placeholder: 'hedy_live_...',
		},
	];

	// Test the credentials
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.hedy.bot',
			url: '/sessions',
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
			qs: {
				limit: 1,
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					message: 'Connected successfully!',
					key: 'success',
					value: true,
				},
			},
		],
	};

	// Define how the credential authenticates requests
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}