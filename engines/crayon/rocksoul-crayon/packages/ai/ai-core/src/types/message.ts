export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ModelMessage {
  id?: string;
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
  createdAt?: string;
}
