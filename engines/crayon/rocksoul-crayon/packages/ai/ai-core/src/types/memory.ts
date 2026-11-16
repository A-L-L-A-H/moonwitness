import type { ModelMessage } from './message.js';

export interface IMemoryProvider {
  getMessages(threadId: string): Promise<ModelMessage[]>;
  saveMessages(threadId: string, messages: ModelMessage[]): Promise<void>;
  createThread(metadata?: Record<string, unknown>): Promise<string>;
  deleteThread(threadId: string): Promise<void>;
}
