// Type definitions for Hedy API

export interface Topic {
	id: string;
	name: string;
	description?: string;
	color?: string;
	iconName?: string;
	topicContext?: string;
	topicContextUpdatedAt?: string;
	createdAt?: string;
	updatedAt?: string;
	overview?: Record<string, unknown> | null;
	overviewUpdatedAt?: string;
	dominantSessionType?: string;
	sessionCount?: number;
	lastSessionDate?: string;
}

export interface SessionContext {
	id: string;
	title: string;
	content?: string;
	isDefault: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface Todo {
	id: string;
	sessionId?: string;
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
	// Summary fields (all session endpoints)
	sessionId: string;
	title: string;
	startTime: string;
	duration: number;
	session_type?: string;
	sessionType?: string;
	topic?: Topic;

	// Detail-only fields (GET /sessions/{id}, webhooks, zapier format)
	endTime?: string;
	transcript?: string;
	cleaned_transcript?: string | null;
	cleanedTranscript?: string | null;
	cleaned_at?: string | null;
	cleanedAt?: string | null;
	conversations?: Conversation[] | string;
	meeting_minutes?: string;
	meetingMinutes?: string;
	recap?: string;
	user_todos?: Todo[];
	userTodos?: Todo[];
	highlights?: Omit<HighlightDetail, 'sessionId'>[];
	session_notes?: string;
	sessionNotes?: string;
	exportedAt?: string;
}

export interface HighlightSummary {
	highlightId: string;
	sessionId: string;
	timestamp: string;
	title: string;
}

export interface HighlightDetail {
	highlightId: string;
	sessionId: string;
	timestamp: string;
	timeIndex: number;
	title: string;
	rawQuote: string;
	cleanedQuote: string;
	mainIdea: string;
	aiInsight: string;
}

export interface SessionHighlightDetail {
	id: string;
	sessionId: string;
	timestamp: string;
	timeIndex: number;
	title: string;
	rawQuote: string;
	cleanedQuote: string;
	mainIdea: string;
	aiInsight: string;
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
	data: Session | HighlightDetail | TodoExported;
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
		total?: number;
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

export interface CreateTopicRequest {
	name: string;
	description?: string;
	color?: string;
	iconName?: string;
	topicContext?: string;
}

export interface UpdateTopicRequest {
	name?: string;
	description?: string;
	color?: string;
	iconName?: string;
	topicContext?: string | null;
}

// Event types
export enum WebhookEvent {
	SessionCreated = 'session.created',
	SessionEnded = 'session.ended',
	SessionExported = 'session.exported',
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
	ContextLimitExceeded = 'context_limit_exceeded',
}
