import { z } from 'zod';

export const FieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'currency',
  'date',
  'datetime',
  'boolean',
  'switch',
  'select',
  'multi-select',
  'relation',
  'user',
  'project',
  'task',
  'badge',
  'json',
  'code',
  'markdown',
  'email',
  'url',
]);

export type FieldType = z.infer<typeof FieldTypeSchema>;

export const FieldOptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export type FieldOption = z.infer<typeof FieldOptionSchema>;

export const FieldDefinitionSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: FieldTypeSchema,
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  hidden: z.boolean().optional(),
  options: z.array(FieldOptionSchema).optional(),
  relationModel: z.string().optional(),
  relationField: z.string().optional(),
  defaultValue: z.unknown().optional(),
  sortable: z.boolean().optional(),
  searchable: z.boolean().optional(),
  width: z.union([z.string(), z.number()]).optional(),
});

export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;

export const ActionDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  variant: z.enum(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']).default('default'),
  position: z.enum(['table-toolbar', 'row-action', 'detail-header', 'kanban-card']).default('table-toolbar'),
  isAiAction: z.boolean().default(false),
  handler: z.string().optional(),
});

export type ActionDefinition = z.infer<typeof ActionDefinitionSchema>;

export const ViewDefinitionSchema = z.object({
  type: z.enum(['table', 'detail', 'kanban', 'timeline', 'form']),
  title: z.string().optional(),
  fields: z.array(z.string()),
  defaultSort: z.object({ field: z.string(), direction: z.enum(['asc', 'desc']) }).optional(),
  groupBy: z.string().optional(),
});

export type ViewDefinition = z.infer<typeof ViewDefinitionSchema>;

export const ResourceDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  pluralLabel: z.string(),
  model: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  primaryKey: z.string().default('id'),
  titleField: z.string().default('name'),
  fields: z.array(FieldDefinitionSchema),
  views: z.record(z.string(), ViewDefinitionSchema),
  actions: z.array(ActionDefinitionSchema).optional(),
  aiCapabilities: z.array(z.string()).optional(),
});

export type ResourceDefinition = z.infer<typeof ResourceDefinitionSchema>;

export interface NavigationItem {
  title: string;
  url: string;
  icon?: string;
  badge?: string;
  resourceId?: string;
  items?: NavigationItem[];
}

export const NavigationItemSchema: z.ZodType<NavigationItem> = z.lazy(() =>
  z.object({
    title: z.string(),
    url: z.string(),
    icon: z.string().optional(),
    badge: z.string().optional(),
    resourceId: z.string().optional(),
    items: z.array(NavigationItemSchema).optional(),
  })
);

export const NavigationGroupSchema = z.object({
  label: z.string(),
  items: z.array(NavigationItemSchema),
});

export type NavigationGroup = z.infer<typeof NavigationGroupSchema>;
