import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class HedyApi implements ICredentialType {
	name = 'hedyApi';
	displayName = 'Hedy API';
	documentationUrl = 'https://api.hedy.bot/docs';
	httpRequestNode = {
		name: 'Hedy',
		docsUrl: 'https://api.hedy.bot/docs',
		apiBaseUrl: 'https://api.hedy.bot/',
	};
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
					key: 'success',
					value: true,
					message: 'Authentication successful!',
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