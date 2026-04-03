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
		{
			displayName: 'Region',
			name: 'region',
			type: 'options',
			default: 'us',
			description: 'Select EU if your Hedy account uses EU data residency',
			options: [
				{
					name: 'US (Default)',
					value: 'us',
				},
				{
					name: 'EU',
					value: 'eu',
				},
			],
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.region === "eu" ? "https://eu-api.hedy.bot" : "https://api.hedy.bot"}}',
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

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}
