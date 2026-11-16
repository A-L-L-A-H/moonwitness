import type { ResourceDefinition } from '../ui-runtime/metadata/contracts.js';

export const mailResource: ResourceDefinition = {
  id: 'mail',
  label: 'Mail',
  pluralLabel: 'Mail Messages',
  model: 'mailbox_messages',
  primaryKey: 'id',
  titleField: 'subject',
  description: 'Team correspondence, email threads, and task extractions.',
  fields: [
    { name: 'id', label: 'ID', type: 'text', readOnly: true },
    { name: 'subject', label: 'Subject', type: 'text', required: true, searchable: true },
    { name: 'senderEmail', label: 'From', type: 'email', required: true },
    { name: 'recipientEmails', label: 'To', type: 'text' },
    { name: 'bodyText', label: 'Message', type: 'textarea' },
    { name: 'isRead', label: 'Read', type: 'boolean' },
    { name: 'createdAt', label: 'Date', type: 'datetime' },
  ],
  views: {
    list: {
      type: 'table',
      fields: ['subject', 'senderEmail', 'isRead', 'createdAt'],
    },
  },
  aiCapabilities: ['summarize_mail', 'draft_reply', 'extract_tasks', 'translate_mail'],
};

export const chatResource: ResourceDefinition = {
  id: 'chat',
  label: 'Chat',
  pluralLabel: 'Chat Conversations',
  model: 'chat_conversations',
  primaryKey: 'id',
  titleField: 'title',
  description: 'Direct messages, channels, and conversation threads.',
  fields: [
    { name: 'id', label: 'ID', type: 'text', readOnly: true },
    { name: 'title', label: 'Conversation', type: 'text', required: true },
    { name: 'type', label: 'Type', type: 'select', options: [{ label: 'Direct', value: 'direct' }, { label: 'Group', value: 'group' }, { label: 'Channel', value: 'channel' }] },
    { name: 'projectId', label: 'Project', type: 'relation', relationModel: 'projects' },
    { name: 'lastMessage', label: 'Last Message', type: 'text' },
    { name: 'updatedAt', label: 'Updated', type: 'datetime' },
  ],
  views: {
    list: {
      type: 'table',
      fields: ['title', 'type', 'lastMessage', 'updatedAt'],
    },
  },
  aiCapabilities: ['summarize_thread', 'extract_action_items'],
};
