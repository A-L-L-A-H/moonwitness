import { chatConversations } from './schema/conversations.js';
import { chatParticipants } from './schema/participants.js';
import { chatMessages } from './schema/messages.js';

export * from './schema/conversations.js';
export * from './schema/participants.js';
export * from './schema/messages.js';
export * from './seed.js';


export const chatSchema = {
  chatConversations,
  chatParticipants,
  chatMessages,
};
