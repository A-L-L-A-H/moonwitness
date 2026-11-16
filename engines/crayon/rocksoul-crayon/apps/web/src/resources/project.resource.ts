import type { ResourceDefinition } from '../ui-runtime/metadata/contracts.js';

export const projectResource: ResourceDefinition = {
  id: 'project',
  label: 'Project',
  pluralLabel: 'Projects',
  model: 'projects',
  primaryKey: 'id',
  titleField: 'name',
  description: 'Collaborative projects with integrated tasks, chat, and files.',
  fields: [
    { name: 'id', label: 'ID', type: 'text', readOnly: true, width: 100 },
    { name: 'name', label: 'Project Name', type: 'text', required: true, searchable: true },
    { name: 'code', label: 'Code', type: 'text', width: 110 },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Planning', value: 'planning' },
        { label: 'Active', value: 'active' },
        { label: 'On Hold', value: 'on_hold' },
        { label: 'Completed', value: 'completed' },
      ],
      width: 120,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
      width: 110,
    },
    { name: 'ownerId', label: 'Owner', type: 'user', width: 130 },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  views: {
    list: {
      type: 'table',
      fields: ['name', 'code', 'status', 'priority', 'ownerId'],
    },
  },
  aiCapabilities: ['analyze_project', 'summarize_status', 'sprint_planning'],
};
