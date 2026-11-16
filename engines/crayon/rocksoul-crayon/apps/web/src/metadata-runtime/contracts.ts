import { z } from 'zod'

const renderTypes = ['text', 'badge', 'avatar', 'date', 'datetime', 'boolean', 'currency', 'link', 'tags', 'json'] as const
const fieldTypes = ['text', 'textarea', 'number', 'email', 'password', 'select', 'boolean', 'date', 'datetime', 'tags', 'relation'] as const
export type NavigationKind = 'RESOURCE' | 'SPECIALIZED_PAGE' | 'SYSTEM_PAGE' | 'EXTERNAL_LINK' | 'CONTAINER'
export type RouteKind = 'STATIC_ROUTE' | 'RESOURCE_ROUTE' | 'SPECIALIZED_ROUTE' | 'SYSTEM_ROUTE'
export const MenuSchema = z.array(z.object({ group: z.string().min(1), items: z.array(z.object({ name: z.string().min(1), label: z.string().min(1), icon: z.string().optional(), path: z.string().startsWith('/'), order: z.number().finite() })) }))
export const MetadataSchema = z.object({ name: z.string().min(1), primaryKey: z.string().min(1), searchableFields: z.array(z.string()).default([]), defaultOrderField: z.string().min(1), description: z.string().optional(), ui: z.object({ label: z.string().min(1), pluralLabel: z.string().min(1), icon: z.string().optional(), menu: z.object({ group: z.string(), order: z.number(), path: z.string() }).optional(), table: z.object({ columns: z.array(z.object({ field: z.string(), label: z.string(), renderType: z.enum(renderTypes).optional(), sortable: z.boolean().optional(), filterable: z.boolean().optional(), width: z.string().optional() })) }).optional(), form: z.object({ fields: z.array(z.object({ field: z.string(), label: z.string(), type: z.enum(fieldTypes), required: z.boolean().optional(), placeholder: z.string().optional(), options: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number(), z.boolean()]) })).optional(), relationModel: z.string().optional(), relationDisplayField: z.string().optional(), relationValueField: z.string().optional(), helperText: z.string().optional(), defaultValue: z.unknown().optional() })) }).optional(), relations: z.record(z.string(), z.object({ type: z.enum(['belongsTo', 'hasMany']), model: z.string(), foreignKey: z.string(), targetKey: z.string().optional(), label: z.string().optional() })).optional() }).optional() })
export type ModelMetadata = z.infer<typeof MetadataSchema>
export interface NavigationItem { readonly kind: NavigationKind; readonly name: string; readonly label: string; readonly path: string; readonly icon?: string; readonly order: number; readonly children?: readonly NavigationItem[] }
export interface NavigationGroup { readonly label: string; readonly items: readonly NavigationItem[] }
export interface RouteDescriptor { readonly kind: RouteKind; readonly path: string; readonly model?: string }
export interface ResourceDescriptor { readonly model: string; readonly label: string; readonly pluralLabel: string; readonly primaryKey: string; readonly metadata: ModelMetadata }

export const normalizeMenu = (raw: unknown): readonly NavigationGroup[] => {
  const parsed = MenuSchema.safeParse(raw); if (!parsed.success) return []
  return parsed.data.map(group => ({ label: group.group, items: group.items.slice().sort((a, b) => a.order - b.order).map(item => ({ kind: 'RESOURCE' as const, ...item })) }))
}
export const normalizeMetadata = (raw: unknown): ModelMetadata | undefined => MetadataSchema.safeParse(raw).data
export class RouteResolver {
  private readonly resourcePaths: ReadonlyMap<string, string>; private readonly specializedPaths: ReadonlySet<string>; private readonly systemPaths: ReadonlySet<string>
  constructor(resourcePaths: ReadonlyMap<string, string>, specializedPaths: ReadonlySet<string>, systemPaths: ReadonlySet<string>) { this.resourcePaths = resourcePaths; this.specializedPaths = specializedPaths; this.systemPaths = systemPaths }
  resolve(path: string): RouteDescriptor { for (const [model, resourcePath] of this.resourcePaths) if (resourcePath === path) return { kind: 'RESOURCE_ROUTE', path, model }; if (this.specializedPaths.has(path)) return { kind: 'SPECIALIZED_ROUTE', path }; if (this.systemPaths.has(path)) return { kind: 'SYSTEM_ROUTE', path }; return { kind: 'STATIC_ROUTE', path } }
}
export class ResourceResolver { resolve(model: string, metadata: ModelMetadata | undefined): ResourceDescriptor | undefined { if (!metadata || metadata.name !== model || !metadata.ui) return undefined; return { model, label: metadata.ui.label, pluralLabel: metadata.ui.pluralLabel, primaryKey: metadata.primaryKey, metadata } } }
