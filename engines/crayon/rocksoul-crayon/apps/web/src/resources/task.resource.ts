import type { ResourceDefinition } from '../ui-runtime/metadata/contracts.js';

export const taskResource: ResourceDefinition = {
  id: 'task',
  label: 'Task',
  pluralLabel: 'Tasks',
  model: 'tasks',
  primaryKey: 'id',
  titleField: 'title',
  description: 'Issue tracker and task management with Table and Kanban views.',
  fields: [
    { name: 'id', label: 'ID', type: 'text', readOnly: true, width: 90 },
    { name: 'title', label: 'Title', type: 'text', required: true, searchable: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Todo', value: 'todo' },
        { label: 'In Progress', value: 'in progress' },
        { label: 'Completed', value: 'completed' },
      ],
      width: 130,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'Minor', value: 'minor' },
        { label: 'Normal', value: 'normal' },
        { label: 'Important', value: 'important' },
        { label: 'Critical', value: 'critical' },
      ],
      width: 110,
    },
    { name: 'projectId', label: 'Project', type: 'relation', relationModel: 'projects', width: 140 },
    { name: 'assigneeId', label: 'Assignee', type: 'user', width: 120 },
    { name: 'dueDate', label: 'Due Date', type: 'date', width: 120 },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  views: {
    list: {
      type: 'table',
      fields: ['title', 'status', 'priority', 'projectId', 'assigneeId', 'dueDate'],
    },
    kanban: {
      type: 'kanban',
      groupBy: 'status',
      fields: ['title', 'priority', 'assigneeId', 'dueDate'],
    },
  },
  aiCapabilities: ['analyze_task', 'plan_task', 'implement_task', 'summarize_task'],
};
