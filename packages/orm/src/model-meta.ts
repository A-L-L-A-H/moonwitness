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

/** Odoo `Many2one` / `One2many`: referential integrity & batch relation hydration (`?with=`). */
export interface ModelRelation {
  model: string;
  type?: "many2one" | "one2many";
  targetField?: string;
  inverseField?: string;
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

/** Odoo `@api.depends` / `moon-orm` computed fields evaluated on read. */
export type ModelComputedFieldFn = (record: Record<string, unknown>) => unknown;
export type ModelComputedFields = Record<string, ModelComputedFieldFn>;

/** Lifecycle hooks harvested from `moon-orm` (`Vertex.beforeSave`/`afterSave`/`beforeDelete`/`afterDelete`). */
export interface ModelHookContext {
  model: string;
  action: ModelWriteAction;
  before: Record<string, unknown> | null;
  values: Record<string, unknown>;
  actor: ActorContext;
}

export interface ModelLifecycleHooks {
  beforeSave?: (ctx: ModelHookContext) => void | Promise<void>;
  afterSave?: (ctx: ModelHookContext) => void | Promise<void>;
  beforeDelete?: (ctx: ModelHookContext) => void | Promise<void>;
  afterDelete?: (ctx: ModelHookContext) => void | Promise<void>;
}

export interface ModelActionContext {
  model: string;
  actor: ActorContext;
  record: Record<string, unknown> | null;
  input: unknown;
  repository: BaseRepository;
}

/** Odoo `type="object"` method exposed over `POST /m/:model[/:id]/call/:action` and `POST /rpc`. */
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
  computed?: ModelComputedFields;
  hooks?: ModelLifecycleHooks;
}

function compileSingleTupleClause(clause: unknown): Record<string, unknown> {
  if (!Array.isArray(clause) || clause.length !== 3) {
    throw new Error("Domain tuple clause must be a 3-element array [field, operator, value].");
  }
  const [rawField, rawOp, value] = clause;
  if (typeof rawField !== "string" || !rawField.trim()) {
    throw new Error("Domain tuple field must be a non-empty string.");
  }
  if (typeof rawOp !== "string" || !rawOp.trim()) {
    throw new Error("Domain tuple operator must be a non-empty string.");
  }
  const field = rawField.trim();
  const op = rawOp.trim().toLowerCase();
  switch (op) {
    case "=":
    case "==":
      return { [field]: value };
    case "!=":
    case "<>":
      return { [field]: { $ne: value } };
    case ">":
      return { [field]: { $gt: value } };
    case ">=":
      return { [field]: { $gte: value } };
    case "<":
      return { [field]: { $lt: value } };
    case "<=":
      return { [field]: { $lte: value } };
    case "in":
      if (!Array.isArray(value)) {
        throw new Error(`Domain operator 'in' on field '${field}' requires an array value.`);
      }
      return { [field]: { $in: value } };
    case "like":
    case "=like":
      return { [field]: { $like: op === "like" && !String(value).includes("%") ? `%${String(value)}%` : String(value) } };
    case "ilike":
    case "=ilike":
      return { [field]: { $ilike: op === "ilike" && !String(value).includes("%") ? `%${String(value)}%` : String(value) } };
    default:
      throw new Error(`Unsupported domain operator '${rawOp}'.`);
  }
}

/**
 * Converts an Odoo / `moon-orm` Polish-notation tuple domain array such as:
 * `[["state", "=", "open"], "|", ["priority", "=", "high"], ["priority", "=", "critical"]]`
 * into an ORM filter AST `{ $and: [...], $or: [...] }`.
 */
export function compileTupleDomainToFilter(domain: unknown[]): Record<string, unknown> {
  if (!Array.isArray(domain)) {
    throw new Error("Domain must be an array.");
  }
  if (domain.length === 0) return {};

  const stack: Array<Record<string, unknown>> = [];
  for (let i = domain.length - 1; i >= 0; i -= 1) {
    const token = domain[i];
    if (token === "|" || token === "&") {
      const left = stack.pop();
      const right = stack.pop();
      if (!left || !right) {
        throw new Error(`Malformed prefix operator '${token}' in domain.`);
      }
      stack.push(token === "|" ? { $or: [left, right] } : { $and: [left, right] });
    } else if (token === "!") {
      throw new Error("Unary '!' operator is not supported in tuple domain; use '!='.");
    } else {
      stack.push(compileSingleTupleClause(token));
    }
  }

  if (stack.length === 1) return stack[0]!;
  return { $and: stack.reverse() };
}
