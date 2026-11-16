export type AppEvent = { eventId: string; eventType: string; sessionId: string; requestId: string; executionId?: string; sequence: number; timestamp: number; priority: number; payload: unknown };
export type DeliveryStatus = 'queued' | 'delivering' | 'success' | 'failed' | 'dead' | 'cancelled';
