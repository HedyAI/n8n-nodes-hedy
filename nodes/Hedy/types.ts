// Type definitions for Hedy API

export interface Topic {
	id: string;
	name: string;
	color: string;
	iconName: string;
}

export interface Todo {
	id: string;
	text: string;
	dueDate?: string;
	completed: boolean;
	topic?: Topic;
}

export interface Conversation {
	question: string;
	answer: string;
	timestamp?: string;
}

export interface Session {
	id: string;
	title: string;
	startTime: string;
	endTime: string;
	duration: number;
	transcript: string;
	conversations: Conversation[] | string;
	meeting_minutes?: string;
	meetingMinutes?: string;
	recap?: string;
	user_todos?: Todo[];
	userTodos?: Todo[];
	topic?: Topic;
}

export interface Highlight {
	id: string;
	sessionId: string;
	timestamp: string;
	title: string;
	rawQuote: string;
	cleanedQuote: string;
	mainIdea: string;
	aiInsights: string;
}

export interface TodoExported {
	id: string;
	sessionId: string;
	text: string;
	dueDate?: string;
}

export interface WebhookPayload {
	event: string;
	timestamp: string;
	data: Session | Highlight | TodoExported;
}

export interface WebhookConfig {
	id?: string;
	url: string;
	events: string[];
	signingSecret?: string;
	createdAt?: string;
	updatedAt?: string;
	enabled?: boolean;
}

export interface PaginationParams {
	limit?: number;
	after?: string;
	before?: string;
}

export interface PaginatedResponse<T> {
	success: boolean;
	data: T[];
	pagination: {
		hasMore: boolean;
		next?: string;
		previous?: string;
	};
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
	error?: {
		code: string;
		message: string;
	};
}

export interface ApiError {
	success: false;
	error: {
		code: string;
		message: string;
	};
}

// Event types
export enum WebhookEvent {
	SessionCreated = 'session.created',
	SessionEnded = 'session.ended',
	HighlightCreated = 'highlight.created',
	TodoExported = 'todo.exported',
}

// Error codes
export enum ErrorCode {
	WebhookLimitExceeded = 'webhook_limit_exceeded',
	InvalidWebhookUrl = 'invalid_webhook_url',
	WebhookNotFound = 'webhook_not_found',
	InvalidEvent = 'invalid_event',
	AuthenticationFailed = 'authentication_failed',
	InvalidParameter = 'invalid_parameter',
	ResourceNotFound = 'resource_not_found',
	InternalError = 'internal_error',
}