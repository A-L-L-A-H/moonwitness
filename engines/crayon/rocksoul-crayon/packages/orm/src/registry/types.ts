import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';

export interface ModelFieldMetadata {
  name: string;
  dataType: string;
  columnType: string;
  notNull: boolean;
  hasDefault: boolean;
  isPrimaryKey: boolean;
}

export type ColumnRenderType =
  | 'text'
  | 'badge'
  | 'avatar'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'currency'
  | 'link'
  | 'tags'
  | 'json';

export interface TableColumnMetadata {
  field: string;
  label: string;
  renderType?: ColumnRenderType;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  badgeVariants?: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>;
}

export interface FormFieldMetadata {
  field: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'email'
    | 'password'
    | 'select'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'tags'
    | 'relation';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number | boolean }>;
  relationModel?: string;
  relationDisplayField?: string;
  relationValueField?: string;
  helperText?: string;
  defaultValue?: any;
}

export interface ModelRelationMetadata {
  type: 'belongsTo' | 'hasMany';
  model: string;
  foreignKey: string;
  targetKey?: string;
  label?: string;
}

export interface ModelUiMetadata {
  label: string;
  pluralLabel: string;
  icon?: string; // Lucide icon name, e.g. Users, Calendar, CheckSquare, MessageSquare, Mail, HelpCircle, Layers
  menu?: {
    group: string; // 'Core' | 'Productivity' | 'Communication' | 'Marketing' | 'Services' | 'Settings'
    order: number;
    path: string;
  };
  table?: {
    columns: TableColumnMetadata[];
    defaultSort?: { field: string; direction: 'asc' | 'desc' };
  };
  form?: {
    fields: FormFieldMetadata[];
  };
  relations?: Record<string, ModelRelationMetadata>;
}

export interface MenuGroup {
  group: string;
  items: Array<{
    name: string;
    label: string;
    icon?: string;
    path: string;
    order: number;
  }>;
}

export interface ModelDefinition<TTable extends SQLiteTableWithColumns<any> = SQLiteTableWithColumns<any>> {
  name: string;
  tableName: string;
  table: TTable;
  primaryKey: string;
  searchableFields: string[];
  defaultOrderField: string;
  description?: string;
  ui?: ModelUiMetadata;
}

export interface FindOptions {
  page?: number;
  limit?: number;
  search?: string;
  filter?: Record<string, unknown>;
  order?: string;
  direction?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
