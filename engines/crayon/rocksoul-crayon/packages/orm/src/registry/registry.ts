import { getTableColumns } from 'drizzle-orm';
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import type {
  ModelDefinition,
  ModelFieldMetadata,
  ModelUiMetadata,
  MenuGroup,
} from './types.js';

// Import All Modular Schemas
import {
  organizations,
  users,
  appSettings,
  systemLogs,
  apiKeys,
  userSessions,
} from '@rocksoul/orm-base';
import { projects } from '@rocksoul/orm-project';
import { tasks } from '@rocksoul/orm-task';
import { calendars, calendarEvents } from '@rocksoul/orm-calendar';
import {
  chatConversations,
  chatParticipants,
  chatMessages,
} from '@rocksoul/orm-chat';
import { faqCategories, faqs } from '@rocksoul/orm-faq';
import {
  landingTestimonials,
  landingLeads,
  landingFeatures,
} from '@rocksoul/orm-landing';
import { mails } from '@rocksoul/orm-mail';
import { pricingPlans, pricingFeatures } from '@rocksoul/orm-services';
import { resourceReferences } from '@rocksoul/orm-resource';
import { researchCases } from '@rocksoul/orm-case';
import { reviewItems } from '@rocksoul/orm-review';
import { researchWorkItems } from '@rocksoul/orm-research';
import { annotations } from '@rocksoul/orm-annotation';

export class ModelRegistry {
  private models = new Map<string, ModelDefinition>();

  register<TTable extends SQLiteTableWithColumns<any>>(
    name: string,
    table: TTable,
    options: Partial<Omit<ModelDefinition<TTable>, 'name' | 'table' | 'tableName'>> = {}
  ): ModelDefinition<TTable> {
    const columns = getTableColumns(table as any);
    const columnNames = Object.keys(columns);

    // Deteksi primary key
    let primaryKey = options.primaryKey || 'id';
    for (const [colKey, col] of Object.entries(columns)) {
      if ((col as any).primary) {
        primaryKey = colKey;
        break;
      }
    }

    // Deteksi default searchable fields
    const searchableFields =
      options.searchableFields ||
      columnNames.filter((colName) =>
        [
          'name',
          'title',
          'email',
          'code',
          'message',
          'description',
          'keyPrefix',
          'subject',
          'question',
          'key',
        ].includes(colName)
      );

    // Default order field (createdAt jika ada, atau primary key)
    const defaultOrderField =
      options.defaultOrderField || (columns.createdAt ? 'createdAt' : primaryKey);

    const definition: ModelDefinition<TTable> = {
      name: name.toLowerCase(),
      tableName: (table as any)[Symbol.for('drizzle:Name')] || name,
      table,
      primaryKey,
      searchableFields,
      defaultOrderField,
      description: options.description,
      ui: options.ui,
    };

    this.models.set(definition.name, definition);
    return definition;
  }

  get(name: string): ModelDefinition | undefined {
    return this.models.get(name.toLowerCase());
  }

  has(name: string): boolean {
    return this.models.has(name.toLowerCase());
  }

  list(): Array<{
    name: string;
    tableName: string;
    primaryKey: string;
    searchableFields: string[];
    defaultOrderField: string;
    description?: string;
    ui?: ModelUiMetadata;
    fields: ModelFieldMetadata[];
  }> {
    const list: any[] = [];
    for (const model of this.models.values()) {
      const columns = getTableColumns(model.table as any);
      const fields: ModelFieldMetadata[] = Object.entries(columns).map(([fieldName, col]) => {
        const c = col as any;
        return {
          name: fieldName,
          dataType: c.dataType || 'unknown',
          columnType: c.columnType || 'unknown',
          notNull: Boolean(c.notNull),
          hasDefault: Boolean(c.hasDefault),
          isPrimaryKey: Boolean(c.primary),
        };
      });

      list.push({
        name: model.name,
        tableName: model.tableName,
        primaryKey: model.primaryKey,
        searchableFields: model.searchableFields,
        defaultOrderField: model.defaultOrderField,
        description: model.description,
        ui: model.ui,
        fields,
      });
    }
    return list;
  }

  getMenu(): MenuGroup[] {
    const groupMap = new Map<string, Array<{ name: string; label: string; icon?: string; path: string; order: number }>>();

    for (const model of this.models.values()) {
      if (model.ui?.menu) {
        const { group, order, path } = model.ui.menu;
        if (!groupMap.has(group)) {
          groupMap.set(group, []);
        }
        groupMap.get(group)!.push({
          name: model.name,
          label: model.ui.label,
          icon: model.ui.icon,
          path,
          order,
        });
      }
    }

    const groups: MenuGroup[] = [];
    for (const [group, items] of groupMap.entries()) {
      items.sort((a, b) => a.order - b.order);
      groups.push({ group, items });
    }

    // Default sorting for groups
    const groupOrder = ['Core', 'Productivity', 'Communication', 'Marketing', 'Services', 'Settings', 'System'];
    groups.sort((a, b) => {
      const idxA = groupOrder.indexOf(a.group);
      const idxB = groupOrder.indexOf(b.group);
      if (idxA === -1 && idxB === -1) return a.group.localeCompare(b.group);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return groups;
  }
}

// Singleton ModelRegistry
export const modelRegistry = new ModelRegistry();

// ==========================================
// 1. Core Module Models (@rocksoul/orm-base)
// ==========================================

modelRegistry.register('organizations', organizations, {
  searchableFields: ['name', 'code'],
  description: 'Organizations and company accounts',
  ui: {
    label: 'Organization',
    pluralLabel: 'Organizations',
    icon: 'Building2',
    menu: { group: 'Core', order: 1, path: '/organizations' },
    table: {
      columns: [
        { field: 'name', label: 'Company Name', sortable: true, filterable: true },
        { field: 'code', label: 'Code', sortable: true },
        { field: 'currency', label: 'Currency', sortable: true },
        { field: 'isActive', label: 'Status', renderType: 'boolean', sortable: true },
        { field: 'createdAt', label: 'Created At', renderType: 'date', sortable: true },
      ],
    },
    form: {
      fields: [
        { field: 'name', label: 'Company Name', type: 'text', required: true },
        { field: 'code', label: 'Code', type: 'text', required: true },
        { field: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
        { field: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
      ],
    },
  },
});

modelRegistry.register('users', users, {
  searchableFields: ['name', 'email', 'role'],
  description: 'User accounts and profile directory',
  ui: {
    label: 'User',
    pluralLabel: 'Users',
    icon: 'Users',
    menu: { group: 'Core', order: 2, path: '/users' },
    table: {
      columns: [
        { field: 'avatar', label: 'Avatar', renderType: 'avatar' },
        { field: 'name', label: 'Full Name', sortable: true, filterable: true },
        { field: 'email', label: 'Email', sortable: true, filterable: true },
        { field: 'role', label: 'Role', renderType: 'badge', sortable: true, filterable: true },
        { field: 'plan', label: 'Plan', renderType: 'badge', sortable: true },
        { field: 'status', label: 'Status', renderType: 'badge', sortable: true },
        { field: 'lastLoginAt', label: 'Last Login', renderType: 'datetime', sortable: true },
      ],
    },
    form: {
      fields: [
        { field: 'name', label: 'Full Name', type: 'text', required: true },
        { field: 'email', label: 'Email Address', type: 'email', required: true },
        { field: 'role', label: 'Role', type: 'select', options: [
          { label: 'Admin', value: 'Admin' },
          { label: 'Editor', value: 'Editor' },
          { label: 'Author', value: 'Author' },
          { label: 'Maintainer', value: 'Maintainer' },
          { label: 'Subscriber', value: 'Subscriber' },
        ], required: true },
        { field: 'plan', label: 'Plan', type: 'select', options: [
          { label: 'Basic', value: 'Basic' },
          { label: 'Professional', value: 'Professional' },
          { label: 'Enterprise', value: 'Enterprise' },
        ] },
        { field: 'billing', label: 'Billing Method', type: 'select', options: [
          { label: 'UPI', value: 'UPI' },
          { label: 'Auto Debit', value: 'Auto Debit' },
          { label: 'Paypal', value: 'Paypal' },
          { label: 'Credit Card', value: 'Credit Card' },
        ] },
        { field: 'status', label: 'Status', type: 'select', options: [
          { label: 'Active', value: 'Active' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Inactive', value: 'Inactive' },
        ] },
        { field: 'phone', label: 'Phone', type: 'text' },
        { field: 'location', label: 'Location', type: 'text' },
        { field: 'bio', label: 'Bio', type: 'textarea' },
      ],
    },
    relations: {
      organization: { type: 'belongsTo', model: 'organizations', foreignKey: 'orgId', label: 'Organization' },
    },
  },
});

modelRegistry.register('app_settings', appSettings, {
  searchableFields: ['category', 'key'],
  description: 'Application configuration and user preferences',
  ui: {
    label: 'Setting',
    pluralLabel: 'Settings',
    icon: 'Settings',
    menu: { group: 'Settings', order: 1, path: '/settings' },
    table: {
      columns: [
        { field: 'category', label: 'Category', renderType: 'badge', sortable: true, filterable: true },
        { field: 'key', label: 'Setting Key', sortable: true, filterable: true },
        { field: 'value', label: 'Config Value' },
        { field: 'isPublic', label: 'Public', renderType: 'boolean', sortable: true },
        { field: 'updatedAt', label: 'Last Updated', renderType: 'datetime', sortable: true },
      ],
    },
    form: {
      fields: [
        { field: 'category', label: 'Category', type: 'select', options: [
          { label: 'Appearance', value: 'appearance' },
          { label: 'Account', value: 'account' },
          { label: 'Billing', value: 'billing' },
          { label: 'Notifications', value: 'notifications' },
          { label: 'Connections', value: 'connections' },
        ], required: true },
        { field: 'key', label: 'Setting Key', type: 'text', required: true },
        { field: 'value', label: 'Value (JSON/String)', type: 'textarea', required: true },
        { field: 'isPublic', label: 'Is Public', type: 'boolean', defaultValue: false },
      ],
    },
    relations: {
      user: { type: 'belongsTo', model: 'users', foreignKey: 'userId', label: 'User' },
    },
  },
});

modelRegistry.register('api_keys', apiKeys, {
  searchableFields: ['name', 'keyPrefix'],
  description: 'API Key management for microservices and integrations',
  ui: {
    label: 'API Key',
    pluralLabel: 'API Keys',
    icon: 'KeyRound',
    menu: { group: 'Settings', order: 2, path: '/settings/connections' },
    table: {
      columns: [
        { field: 'name', label: 'Key Name', sortable: true },
        { field: 'keyPrefix', label: 'Prefix / ID', sortable: true },
        { field: 'isActive', label: 'Status', renderType: 'boolean', sortable: true },
        { field: 'lastUsedAt', label: 'Last Used', renderType: 'datetime', sortable: true },
        { field: 'createdAt', label: 'Created At', renderType: 'date', sortable: true },
      ],
    },
    relations: {
      user: { type: 'belongsTo', model: 'users', foreignKey: 'userId', label: 'Owner' },
    },
  },
});

modelRegistry.register('user_sessions', userSessions, {
  searchableFields: ['ipAddress', 'userAgent'],
  description: 'User login sessions and authentication tokens',
  ui: {
    label: 'Session',
    pluralLabel: 'Sessions',
    icon: 'ShieldCheck',
    table: {
      columns: [
        { field: 'ipAddress', label: 'IP Address', sortable: true },
        { field: 'userAgent', label: 'Device / Browser' },
        { field: 'isRevoked', label: 'Revoked', renderType: 'boolean', sortable: true },
        { field: 'expiresAt', label: 'Expires At', renderType: 'datetime', sortable: true },
      ],
    },
    relations: {
      user: { type: 'belongsTo', model: 'users', foreignKey: 'userId', label: 'User' },
    },
  },
});

modelRegistry.register('system_logs', systemLogs, {
  searchableFields: ['message', 'url', 'reqId'],
  defaultOrderField: 'createdAt',
  description: 'System audit and HTTP request logs',
  ui: {
    label: 'System Log',
    pluralLabel: 'System Logs',
    icon: 'ScrollText',
    menu: { group: 'System', order: 1, path: '/logs' },
    table: {
      columns: [
        { field: 'level', label: 'Level', renderType: 'badge', sortable: true, filterable: true },
        { field: 'method', label: 'Method', renderType: 'badge', sortable: true },
        { field: 'url', label: 'Endpoint', sortable: true },
        { field: 'statusCode', label: 'Status', renderType: 'badge', sortable: true },
        { field: 'responseTime', label: 'Time (ms)', sortable: true },
        { field: 'createdAt', label: 'Timestamp', renderType: 'datetime', sortable: true },
      ],
    },
  },
});

// ==========================================
// 2. Productivity Module Models
// ==========================================

modelRegistry.register('projects', projects, {
  searchableFields: ['name', 'code', 'description'],
  description: 'Projects master data',
  ui: {
    label: 'Project',
    pluralLabel: 'Projects',
    icon: 'Briefcase',
    menu: { group: 'Productivity', order: 1, path: '/projects' },
    table: {
      columns: [
        { field: 'name', label: 'Project Name', sortable: true, filterable: true },
        { field: 'code', label: 'Code', sortable: true },
        { field: 'status', label: 'Status', renderType: 'badge', sortable: true, filterable: true },
        { field: 'budget', label: 'Budget', renderType: 'currency', sortable: true },
        { field: 'createdAt', label: 'Created At', renderType: 'date', sortable: true },
      ],
    },
    form: {
      fields: [
        { field: 'name', label: 'Project Name', type: 'text', required: true },
        { field: 'code', label: 'Project Code', type: 'text', required: true },
        { field: 'description', label: 'Description', type: 'textarea' },
        { field: 'status', label: 'Status', type: 'select', options: [
          { label: 'Planned', value: 'planned' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'On Hold', value: 'on_hold' },
        ] },
        { field: 'budget', label: 'Budget', type: 'number', defaultValue: 0 },
      ],
    },
    relations: {
      owner: { type: 'belongsTo', model: 'users', foreignKey: 'ownerId', label: 'Owner' },
      organization: { type: 'belongsTo', model: 'organizations', foreignKey: 'orgId', label: 'Organization' },
    },
  },
});

modelRegistry.register('tasks', tasks, {
  searchableFields: ['title', 'status', 'category', 'priority'],
  description: 'Tasks and issue management',
  ui: {
    label: 'Task',
    pluralLabel: 'Tasks',
    icon: 'CheckSquare',
    menu: { group: 'Productivity', order: 2, path: '/tasks' },
    table: {
      columns: [
        { field: 'id', label: 'Task ID', sortable: true },
        { field: 'title', label: 'Title', sortable: true, filterable: true },
        { field: 'status', label: 'Status', renderType: 'badge', sortable: true, filterable: true },
        { field: 'category', label: 'Category', renderType: 'badge', sortable: true, filterable: true },
        { field: 'priority', label: 'Priority', renderType: 'badge', sortable: true, filterable: true },
        { field: 'dueDate', label: 'Due Date', renderType: 'date', sortable: true },
      ],
    },
    form: {
      fields: [
        { field: 'id', label: 'Task ID', type: 'text', placeholder: 'TASK-1001', required: true },
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'projectId', label: 'Project', type: 'relation', relationModel: 'projects', relationDisplayField: 'name', relationValueField: 'id' },
        { field: 'assigneeId', label: 'Assignee', type: 'relation', relationModel: 'users', relationDisplayField: 'name', relationValueField: 'id' },
        { field: 'status', label: 'Status', type: 'select', options: [
          { label: 'Todo', value: 'todo' },
          { label: 'In Progress', value: 'in progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Canceled', value: 'canceled' },
        ], defaultValue: 'todo' },
        { field: 'category', label: 'Category', type: 'select', options: [
          { label: 'Feature', value: 'feature' },
          { label: 'Bug', value: 'bug' },
          { label: 'Documentation', value: 'documentation' },
        ], defaultValue: 'feature' },
        { field: 'priority', label: 'Priority', type: 'select', options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Critical', value: 'critical' },
          { label: 'Important', value: 'important' },
        ], defaultValue: 'medium' },
        { field: 'dueDate', label: 'Due Date', type: 'date' },
        { field: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    relations: {
      project: { type: 'belongsTo', model: 'projects', foreignKey: 'projectId', label: 'Project' },
      assignee: { type: 'belongsTo', model: 'users', foreignKey: 'assigneeId', label: 'Assignee' },
    },
  },
});

// Operational models are deliberately selective: service internals, publication payloads,
// storage keys, cache state, and activity logs are not generic CRUD resources.
modelRegistry.register('resource_references', resourceReferences, { searchableFields: ['canonicalRef', 'repository', 'recordType', 'recordId', 'title'], description: 'Local references and projections of remotely canonical resources' });
modelRegistry.register('research_cases', researchCases, { searchableFields: ['caseNo', 'title', 'status'], description: 'Private operational dossiers; never canonical research records' });
modelRegistry.register('review_items', reviewItems, { searchableFields: ['kind', 'status', 'targetRepository', 'targetDomain'], description: 'Human review workflow; execution IDs are references only' });
modelRegistry.register('research_work_items', researchWorkItems, { searchableFields: ['kind', 'status', 'executionId'], description: 'Operational research work, with candidate-only findings' });
modelRegistry.register('annotations', annotations, { searchableFields: ['body', 'visibility'], description: 'Private Crayon annotations, not Community comments' });

modelRegistry.register('calendars', calendars, {
  searchableFields: ['name', 'type'],
  description: 'Calendar collections',
  ui: {
    label: 'Calendar',
    pluralLabel: 'Calendars',
    icon: 'Calendar',
    table: {
      columns: [
        { field: 'name', label: 'Calendar Name', sortable: true },
        { field: 'type', label: 'Type', renderType: 'badge', sortable: true },
        { field: 'color', label: 'Color' },
        { field: 'visible', label: 'Visible', renderType: 'boolean', sortable: true },
      ],
    },
    relations: {
      user: { type: 'belongsTo', model: 'users', foreignKey: 'userId', label: 'Owner' },
    },
  },
});

modelRegistry.register('calendar_events', calendarEvents, {
  searchableFields: ['title', 'location', 'type'],
  description: 'Calendar events and scheduling',
  ui: {
    label: 'Calendar Event',
    pluralLabel: 'Calendar Events',
    icon: 'CalendarDays',
    menu: { group: 'Productivity', order: 3, path: '/calendar' },
    table: {
      columns: [
        { field: 'title', label: 'Event Title', sortable: true, filterable: true },
        { field: 'date', label: 'Date', renderType: 'date', sortable: true },
        { field: 'time', label: 'Time', sortable: true },
        { field: 'duration', label: 'Duration' },
        { field: 'type', label: 'Type', renderType: 'badge', sortable: true, filterable: true },
        { field: 'location', label: 'Location' },
      ],
    },
    form: {
      fields: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'date', label: 'Date', type: 'date', required: true },
        { field: 'time', label: 'Time', type: 'text', placeholder: '09:00' },
        { field: 'duration', label: 'Duration', type: 'text', placeholder: '1h' },
        { field: 'type', label: 'Type', type: 'select', options: [
          { label: 'Meeting', value: 'meeting' },
          { label: 'Event', value: 'event' },
          { label: 'Personal', value: 'personal' },
          { label: 'Task', value: 'task' },
          { label: 'Reminder', value: 'reminder' },
        ], defaultValue: 'meeting' },
        { field: 'location', label: 'Location', type: 'text' },
        { field: 'color', label: 'Color Badge', type: 'text' },
        { field: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    relations: {
      calendar: { type: 'belongsTo', model: 'calendars', foreignKey: 'calendarId', label: 'Calendar' },
      user: { type: 'belongsTo', model: 'users', foreignKey: 'userId', label: 'Organizer' },
    },
  },
});

// ==========================================
// 3. Communication Module Models
// ==========================================

modelRegistry.register('chat_conversations', chatConversations, {
  searchableFields: ['name', 'type'],
  description: 'Chat channels and direct conversations',
  ui: {
    label: 'Chat Conversation',
    pluralLabel: 'Chat Conversations',
    icon: 'MessageSquare',
    menu: { group: 'Communication', order: 1, path: '/chat' },
    table: {
      columns: [
        { field: 'name', label: 'Channel / Chat', sortable: true, filterable: true },
        { field: 'type', label: 'Type', renderType: 'badge', sortable: true },
        { field: 'lastMessageContent', label: 'Last Message' },
        { field: 'lastMessageTime', label: 'Time', renderType: 'datetime', sortable: true },
        { field: 'unreadCount', label: 'Unread', renderType: 'badge', sortable: true },
      ],
    },
  },
});

modelRegistry.register('chat_messages', chatMessages, {
  searchableFields: ['content'],
  description: 'Messages in conversations',
  ui: {
    label: 'Chat Message',
    pluralLabel: 'Chat Messages',
    icon: 'MessagesSquare',
    table: {
      columns: [
        { field: 'content', label: 'Message Content', sortable: true },
        { field: 'type', label: 'Type', renderType: 'badge' },
        { field: 'isEdited', label: 'Edited', renderType: 'boolean' },
        { field: 'createdAt', label: 'Sent At', renderType: 'datetime', sortable: true },
      ],
    },
    relations: {
      conversation: { type: 'belongsTo', model: 'chat_conversations', foreignKey: 'conversationId', label: 'Conversation' },
      sender: { type: 'belongsTo', model: 'users', foreignKey: 'senderId', label: 'Sender' },
    },
  },
});

modelRegistry.register('mails', mails, {
  searchableFields: ['subject', 'email', 'name', 'text'],
  description: 'Emails and message communications',
  ui: {
    label: 'Mail',
    pluralLabel: 'Mails',
    icon: 'Mail',
    menu: { group: 'Communication', order: 2, path: '/mail' },
    table: {
      columns: [
        { field: 'name', label: 'Sender', sortable: true, filterable: true },
        { field: 'subject', label: 'Subject', sortable: true, filterable: true },
        { field: 'folder', label: 'Folder', renderType: 'badge', sortable: true, filterable: true },
        { field: 'read', label: 'Read', renderType: 'boolean', sortable: true },
        { field: 'date', label: 'Date', renderType: 'datetime', sortable: true },
      ],
    },
    form: {
      fields: [
        { field: 'name', label: 'Sender Name', type: 'text', required: true },
        { field: 'email', label: 'Email Address', type: 'email', required: true },
        { field: 'subject', label: 'Subject', type: 'text', required: true },
        { field: 'text', label: 'Message Body', type: 'textarea', required: true },
        { field: 'folder', label: 'Folder', type: 'select', options: [
          { label: 'Inbox', value: 'inbox' },
          { label: 'Sent', value: 'sent' },
          { label: 'Draft', value: 'draft' },
          { label: 'Trash', value: 'trash' },
          { label: 'Archive', value: 'archive' },
        ], defaultValue: 'inbox' },
      ],
    },
    relations: {
      user: { type: 'belongsTo', model: 'users', foreignKey: 'userId', label: 'User' },
    },
  },
});

// ==========================================
// 4. Marketing & Content Module Models
// ==========================================

modelRegistry.register('faq_categories', faqCategories, {
  searchableFields: ['name', 'slug'],
  description: 'FAQ topic categories',
  ui: {
    label: 'FAQ Category',
    pluralLabel: 'FAQ Categories',
    icon: 'FolderTree',
    table: {
      columns: [
        { field: 'name', label: 'Category Name', sortable: true, filterable: true },
        { field: 'slug', label: 'Slug', sortable: true },
        { field: 'orderIndex', label: 'Order', sortable: true },
      ],
    },
  },
});

modelRegistry.register('faqs', faqs, {
  searchableFields: ['question', 'answer'],
  description: 'Frequently Asked Questions',
  ui: {
    label: 'FAQ',
    pluralLabel: 'FAQs',
    icon: 'HelpCircle',
    menu: { group: 'Marketing', order: 1, path: '/faqs' },
    table: {
      columns: [
        { field: 'question', label: 'Question', sortable: true, filterable: true },
        { field: 'isPublished', label: 'Published', renderType: 'boolean', sortable: true },
        { field: 'orderIndex', label: 'Order', sortable: true },
      ],
    },
    form: {
      fields: [
        { field: 'categoryId', label: 'Category', type: 'relation', relationModel: 'faq_categories', relationDisplayField: 'name', relationValueField: 'id', required: true },
        { field: 'question', label: 'Question', type: 'text', required: true },
        { field: 'answer', label: 'Answer', type: 'textarea', required: true },
        { field: 'isPublished', label: 'Published', type: 'boolean', defaultValue: true },
        { field: 'orderIndex', label: 'Display Order', type: 'number', defaultValue: 0 },
      ],
    },
    relations: {
      category: { type: 'belongsTo', model: 'faq_categories', foreignKey: 'categoryId', label: 'Category' },
    },
  },
});

modelRegistry.register('landing_testimonials', landingTestimonials, {
  searchableFields: ['name', 'role', 'company', 'quote'],
  description: 'Customer reviews and testimonials',
  ui: {
    label: 'Testimonial',
    pluralLabel: 'Testimonials',
    icon: 'Quote',
    menu: { group: 'Marketing', order: 2, path: '/landing#testimonials' },
    table: {
      columns: [
        { field: 'image', label: 'Photo', renderType: 'avatar' },
        { field: 'name', label: 'Client Name', sortable: true },
        { field: 'role', label: 'Role / Title', sortable: true },
        { field: 'quote', label: 'Testimonial' },
        { field: 'isFeatured', label: 'Featured', renderType: 'boolean', sortable: true },
      ],
    },
    form: {
      fields: [
        { field: 'name', label: 'Name', type: 'text', required: true },
        { field: 'role', label: 'Role / Designation', type: 'text', required: true },
        { field: 'company', label: 'Company', type: 'text' },
        { field: 'image', label: 'Avatar URL', type: 'text' },
        { field: 'quote', label: 'Testimonial Quote', type: 'textarea', required: true },
        { field: 'isFeatured', label: 'Featured', type: 'boolean', defaultValue: true },
      ],
    },
  },
});

modelRegistry.register('landing_leads', landingLeads, {
  searchableFields: ['firstName', 'lastName', 'email', 'subject', 'message'],
  description: 'Contact form submissions and leads',
  ui: {
    label: 'Contact Lead',
    pluralLabel: 'Contact Leads',
    icon: 'Inbox',
    menu: { group: 'Marketing', order: 3, path: '/landing#contact' },
    table: {
      columns: [
        { field: 'firstName', label: 'First Name', sortable: true },
        { field: 'lastName', label: 'Last Name', sortable: true },
        { field: 'email', label: 'Email', sortable: true, filterable: true },
        { field: 'subject', label: 'Subject', sortable: true },
        { field: 'status', label: 'Status', renderType: 'badge', sortable: true, filterable: true },
        { field: 'createdAt', label: 'Received At', renderType: 'datetime', sortable: true },
      ],
    },
  },
});

modelRegistry.register('landing_features', landingFeatures, {
  searchableFields: ['title', 'description'],
  description: 'Landing page feature highlights',
  ui: {
    label: 'Landing Feature',
    pluralLabel: 'Landing Features',
    icon: 'Sparkles',
    table: {
      columns: [
        { field: 'title', label: 'Title', sortable: true },
        { field: 'category', label: 'Category', renderType: 'badge', sortable: true },
        { field: 'icon', label: 'Icon' },
        { field: 'orderIndex', label: 'Order', sortable: true },
      ],
    },
  },
});

// ==========================================
// 5. Services & Pricing Module Models
// ==========================================

modelRegistry.register('pricing_plans', pricingPlans, {
  searchableFields: ['name', 'description'],
  description: 'Subscription pricing tiers and packages',
  ui: {
    label: 'Pricing Plan',
    pluralLabel: 'Pricing Plans',
    icon: 'CreditCard',
    menu: { group: 'Services', order: 1, path: '/pricing' },
    table: {
      columns: [
        { field: 'name', label: 'Plan Name', sortable: true },
        { field: 'price', label: 'Price', sortable: true },
        { field: 'frequency', label: 'Billing Cycle' },
        { field: 'popular', label: 'Popular', renderType: 'boolean', sortable: true },
        { field: 'current', label: 'Current Default', renderType: 'boolean', sortable: true },
      ],
    },
    form: {
      fields: [
        { field: 'id', label: 'Plan Slug / ID', type: 'text', placeholder: 'basic', required: true },
        { field: 'name', label: 'Plan Name', type: 'text', required: true },
        { field: 'description', label: 'Short Description', type: 'textarea', required: true },
        { field: 'price', label: 'Price Tag', type: 'text', placeholder: '$19', required: true },
        { field: 'frequency', label: 'Frequency', type: 'text', defaultValue: '/month' },
        { field: 'features', label: 'Features (JSON array)', type: 'textarea', required: true },
        { field: 'popular', label: 'Mark as Popular', type: 'boolean', defaultValue: false },
      ],
    },
  },
});

modelRegistry.register('pricing_features', pricingFeatures, {
  searchableFields: ['name', 'description'],
  description: 'Feature comparison catalog for plans',
  ui: {
    label: 'Pricing Feature',
    pluralLabel: 'Pricing Features',
    icon: 'Layers',
    table: {
      columns: [
        { field: 'name', label: 'Feature Name', sortable: true },
        { field: 'description', label: 'Description' },
        { field: 'icon', label: 'Icon' },
        { field: 'orderIndex', label: 'Order', sortable: true },
      ],
    },
  },
});
