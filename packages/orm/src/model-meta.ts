import type { z } from "zod";
import type { ActorContext } from "./actor-context.js";
import type { BaseRepository, ScopedRepository } from "./define-model.js";

export type ModelRole = "admin" | "editor" | "viewer" | "public";
export type ModelWriteAction = "CREATE" | "UPDATE" | "ARCHIVE" | "RESTORE" | "DELETE";

export interface FieldPolicySpec {
  readRoles?: ModelRole[];
  writeRoles?: ModelRole[];
  readGroups?: string[];
  writeGroups?: string[];
  sensitive?: boolean;
}

/** Odoo `@api.constrains`: runs inside the write transaction before the SQL statement. */
export interface ConstrainContext {
  model: string;
  action: ModelWriteAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  actor: ActorContext;
}
export type ModelConstraint = (ctx: ConstrainContext) => void | Promise<void>;

/** Odoo `Many2one` / `One2many` / `Many2many`: referential integrity & batch relation hydration (`?with=`). */
export interface ModelRelation {
  model: string;
  type?: "many2one" | "one2many" | "many2many";
  targetField?: string;
  inverseField?: string;
  onDelete?: "restrict" | "set null" | "ignore";
  through?: string;
  sourceKey?: string;
  targetKey?: string;
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

/** Odoo `@api.depends` / `moon-orm` computed fields evaluated on read or stored on write. */
export type StoredComputedFieldType = "text" | "integer" | "real" | "boolean" | "json";
export type ModelComputedFieldFn = (record: Record<string, unknown>) => unknown;
export interface ModelComputedFieldSpec {
  depends: string[];
  compute: ModelComputedFieldFn;
  stored?: boolean;
  type?: StoredComputedFieldType;
}
export type ModelComputedFieldDef = ModelComputedFieldFn | ModelComputedFieldSpec;
export type ModelComputedFields = Record<string, ModelComputedFieldDef>;

/** Normalize function-style or object-style computed field definitions into a uniform descriptor. */
export function normalizeComputedFieldDef(def: ModelComputedFieldDef): {
  depends: string[];
  compute: ModelComputedFieldFn;
  stored: boolean;
  type: StoredComputedFieldType;
} {
  if (typeof def === "function") {
    return { depends: [], compute: def, stored: false, type: "text" };
  }
  return {
    depends: [...(def.depends ?? [])],
    compute: def.compute,
    stored: Boolean(def.stored),
    type: def.type ?? "text",
  };
}

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
  beforeArchive?: (ctx: ModelHookContext) => void | Promise<void>;
  afterArchive?: (ctx: ModelHookContext) => void | Promise<void>;
  beforeRestore?: (ctx: ModelHookContext) => void | Promise<void>;
  afterRestore?: (ctx: ModelHookContext) => void | Promise<void>;
  beforeDelete?: (ctx: ModelHookContext) => void | Promise<void>;
  afterDelete?: (ctx: ModelHookContext) => void | Promise<void>;
}

export interface ModelActionContext {
  model: string;
  actor: ActorContext;
  record: Record<string, unknown> | null;
  input: unknown;
  repository: BaseRepository | ScopedRepository;
}

/** Odoo `type="object"` method exposed over `POST /m/:model[/:id]/call/:action` and `POST /rpc`. */
export interface ModelActionDef {
  scope: "model" | "record";
  operation?: "read" | "create" | "update" | "delete";
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
  fieldPolicies?: Record<string, FieldPolicySpec>;
  allowFreeformExtra?: boolean;
}

export const MAX_DOMAIN_CLAUSES = 64;
export const MAX_DOMAIN_DEPTH = 12;
export const MAX_IN_LIST_SIZE = 200;
export const MAX_STRING_VALUE_LEN = 1000;

function assertSafeDomainScalar(
  value: unknown,
  field: string,
  allowNull: boolean,
): string | number | boolean | null {
  if (value === null) {
    if (!allowNull) {
      throw new Error(`Domain value for field '${field}' cannot be null.`);
    }
    return null;
  }
  if (typeof value === "string") {
    if (value.length > MAX_STRING_VALUE_LEN) {
      throw new Error(
        `Domain string value on field '${field}' exceeds maximum length of ${MAX_STRING_VALUE_LEN}.`,
      );
    }
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Domain numeric value on field '${field}' must be finite.`);
    }
    return value;
  }
  if (typeof value === "boolean") {
    return value;
  }
  throw new Error(
    `Domain value on field '${field}' must be a scalar (string, number, boolean${allowNull ? ", or null" : ""}).`,
  );
}

function formatLikePattern(value: unknown, field: string, wrapWildcards: boolean): string {
  if (value === null || value === undefined || typeof value === "object") {
    throw new Error(`Domain LIKE operator on field '${field}' requires a string value.`);
  }
  const raw = String(value);
  const pattern = wrapWildcards && !raw.includes("%") ? `%${raw}%` : raw;
  if (pattern.length > MAX_STRING_VALUE_LEN) {
    throw new Error(
      `Domain LIKE pattern on field '${field}' exceeds maximum length of ${MAX_STRING_VALUE_LEN}.`,
    );
  }
  return pattern;
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
  if (field.length > MAX_STRING_VALUE_LEN) {
    throw new Error(`Domain field name exceeds maximum length of ${MAX_STRING_VALUE_LEN}.`);
  }
  const op = rawOp.trim().toLowerCase().replace(/\s+/g, " ");
  switch (op) {
    case "=":
    case "==":
      return { [field]: assertSafeDomainScalar(value, field, true) };
    case "!=":
    case "<>":
      return { [field]: { $ne: assertSafeDomainScalar(value, field, true) } };
    case ">":
      return { [field]: { $gt: assertSafeDomainScalar(value, field, false) } };
    case ">=":
      return { [field]: { $gte: assertSafeDomainScalar(value, field, false) } };
    case "<":
      return { [field]: { $lt: assertSafeDomainScalar(value, field, false) } };
    case "<=":
      return { [field]: { $lte: assertSafeDomainScalar(value, field, false) } };
    case "in":
    case "not in": {
      if (!Array.isArray(value)) {
        throw new Error(`Domain operator '${op}' on field '${field}' requires an array value.`);
      }
      if (value.length > MAX_IN_LIST_SIZE) {
        throw new Error(
          `Domain operator '${op}' on field '${field}' exceeds maximum list size of ${MAX_IN_LIST_SIZE}.`,
        );
      }
      const normalized = value.map((item) => assertSafeDomainScalar(item, field, true));
      return op === "in"
        ? { [field]: { $in: normalized } }
        : { $not: { [field]: { $in: normalized } } };
    }
    case "like":
    case "=like":
      return {
        [field]: {
          $like: formatLikePattern(value, field, op === "like"),
        },
      };
    case "not like":
      return {
        $not: {
          [field]: {
            $like: formatLikePattern(value, field, true),
          },
        },
      };
    case "ilike":
    case "=ilike":
      return {
        [field]: {
          $ilike: formatLikePattern(value, field, op === "ilike"),
        },
      };
    case "not ilike":
      return {
        $not: {
          [field]: {
            $ilike: formatLikePattern(value, field, true),
          },
        },
      };
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
  if (domain.length > MAX_DOMAIN_CLAUSES * 4) {
    throw new Error(`Domain exceeds maximum token budget.`);
  }

  let clauseCount = 0;
  const stack: Array<{ node: Record<string, unknown>; depth: number }> = [];
  for (let i = domain.length - 1; i >= 0; i -= 1) {
    const token = domain[i];
    if (token === "|" || token === "&") {
      const left = stack.pop();
      const right = stack.pop();
      if (!left || !right) {
        throw new Error(`Malformed prefix operator '${token}' in domain.`);
      }
      const depth = Math.max(left.depth, right.depth) + 1;
      if (depth > MAX_DOMAIN_DEPTH) {
        throw new Error(`Domain exceeds maximum nesting depth of ${MAX_DOMAIN_DEPTH}.`);
      }
      stack.push({
        node: token === "|" ? { $or: [left.node, right.node] } : { $and: [left.node, right.node] },
        depth,
      });
    } else if (token === "!") {
      const operand = stack.pop();
      if (!operand) {
        throw new Error("Malformed prefix operator '!' in domain.");
      }
      const depth = operand.depth + 1;
      if (depth > MAX_DOMAIN_DEPTH) {
        throw new Error(`Domain exceeds maximum nesting depth of ${MAX_DOMAIN_DEPTH}.`);
      }
      stack.push({ node: { $not: operand.node }, depth });
    } else {
      clauseCount += 1;
      if (clauseCount > MAX_DOMAIN_CLAUSES) {
        throw new Error(`Domain exceeds maximum clause count of ${MAX_DOMAIN_CLAUSES}.`);
      }
      stack.push({ node: compileSingleTupleClause(token), depth: 1 });
    }
  }

  if (stack.length === 1) return stack[0]!.node;
  const maxDepth = Math.max(...stack.map((entry) => entry.depth)) + 1;
  if (maxDepth > MAX_DOMAIN_DEPTH) {
    throw new Error(`Domain exceeds maximum nesting depth of ${MAX_DOMAIN_DEPTH}.`);
  }
  return { $and: stack.reverse().map((entry) => entry.node) };
}
