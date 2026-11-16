import type { ResourceDefinition } from '../ui-runtime/metadata/contracts.js';

export const userResource: ResourceDefinition = {
  id: 'user',
  label: 'User',
  pluralLabel: 'Users',
  model: 'users',
  primaryKey: 'id',
  titleField: 'name',
  description: 'Team members, permissions, and roles.',
  fields: [
    { name: 'id', label: 'ID', type: 'text', readOnly: true, width: 80 },
    { name: 'name', label: 'Name', type: 'text', required: true, searchable: true },
    { name: 'email', label: 'Email', type: 'email', required: true, searchable: true },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'Admin' },
        { label: 'Editor', value: 'Editor' },
        { label: 'Maintainer', value: 'Maintainer' },
        { label: 'Author', value: 'Author' },
        { label: 'Subscriber', value: 'Subscriber' },
      ],
      width: 120,
    },
    { name: 'status', label: 'Status', type: 'badge', width: 110 },
    { name: 'plan', label: 'Plan', type: 'badge', width: 110 },
    { name: 'company', label: 'Company', type: 'text' },
  ],
  views: {
    list: {
      type: 'table',
      fields: ['name', 'email', 'role', 'status', 'plan'],
    },
  },
  aiCapabilities: ['summarize_profile'],
};
