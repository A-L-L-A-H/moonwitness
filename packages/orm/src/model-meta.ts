import type { z } from "zod";
import type { ActorContext } from "./actor-context.js";
import type { BaseRepository } from "./define-model.js";

export type ModelRole = "admin" | "editor" | "viewer" | "public";
export type ModelWriteAction = "CREATE" | "UPDATE" | "ARCHIVE" | "RESTORE" | "DELETE";

/** Odoo `@api.constrains`: runs inside the write transaction before the SQL statement. */
export interface ConstrainContext {
  model: string;
  action: ModelWriteAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  actor: ActorContext;
}
export type ModelConstraint = (ctx: ConstrainContext) => void | Promise<void>;

/** Odoo `Many2one`: referential integrity validated on write and protected on delete. */
export interface ModelRelation {
  model: string;
  targetField?: string;
  onDelete?: "restrict" | "ignore";
}

/** Declarative retention replacing hand-written `DELETE ... NOT IN (...)` pruning. */
export interface ModelRetention {
  maxRows?: number;
  orderField?: string;
  ttlDays?: number;
  dateField?: string;
}

/** Odoo `default=lambda self: ...` evaluated against the acting user. */
export type ModelDefaultValue =
  | ((actor: ActorContext) => unknown)
  | string
  | number
  | boolean
  | null
  | unknown[]
  | { [key: string]: unknown };
export type ModelDefaults = Record<string, ModelDefaultValue>;

export interface ModelActionContext {
  model: string;
  actor: ActorContext;
  record: Record<string, unknown> | null;
  input: unknown;
  repository: BaseRepository;
}

/** Odoo `type="object"` method exposed over `POST /m/:model[/:id]/call/:action`. */
export interface ModelActionDef {
  scope: "model" | "record";
  roles?: ModelRole[];
  label?: string;
  input?: z.ZodType;
  handler: (ctx: ModelActionContext) => unknown | Promise<unknown>;
}

export interface ModelFeatureOptions {
  searchFields?: string[];
  defaults?: ModelDefaults;
  constrains?: ModelConstraint[];
  relations?: Record<string, ModelRelation>;
  retention?: ModelRetention;
  actions?: Record<string, ModelActionDef>;
}
