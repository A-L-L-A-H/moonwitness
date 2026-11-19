import {
  modelRegistry,
  PolicyError,
  type FieldPolicySpec,
  type RegisteredModelDescriptor,
} from "@moonwitness/orm";
import type { CrewRoleOrPublic } from "./runtime.js";

export const SENSITIVE_FIELD_RE = /password_hash|_token|_secret|encrypted_private/i;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)
  );
}

/** Returns true when `role` is permitted to read `field` on `desc`. */
export function canReadField(
  desc: RegisteredModelDescriptor | undefined,
  field: string,
  role: CrewRoleOrPublic,
): boolean {
  const policy = desc?.fieldPolicies?.[field];
  if (policy?.readRoles !== undefined) {
    return policy.readRoles.includes(role);
  }
  if (policy?.sensitive === true || SENSITIVE_FIELD_RE.test(field)) {
    return false;
  }
  return true;
}

/** Returns true when `role` is permitted to write `field` on `desc`. */
export function canWriteField(
  desc: RegisteredModelDescriptor | undefined,
  field: string,
  role: CrewRoleOrPublic,
): boolean {
  const policy = desc?.fieldPolicies?.[field];
  if (policy?.writeRoles !== undefined) {
    return policy.writeRoles.includes(role);
  }
  if (policy?.sensitive === true || SENSITIVE_FIELD_RE.test(field)) {
    return false;
  }
  return true;
}

/** Computes effective field policies for admin inspection in view descriptors. */
export function getEffectiveFieldPolicies(
  desc: RegisteredModelDescriptor,
): Record<string, FieldPolicySpec> {
  const result: Record<string, FieldPolicySpec> = {};
  for (const fieldName of desc.fields.keys()) {
    const declared = desc.fieldPolicies?.[fieldName];
    const isSensitive = declared?.sensitive === true || SENSITIVE_FIELD_RE.test(fieldName);
    if (!declared && !isSensitive) continue;
    result[fieldName] = {
      ...(declared?.readRoles ? { readRoles: [...declared.readRoles] } : {}),
      ...(declared?.writeRoles ? { writeRoles: [...declared.writeRoles] } : {}),
      ...(isSensitive ? { sensitive: true } : {}),
    };
  }
  for (const [fieldName, declared] of Object.entries(desc.fieldPolicies ?? {})) {
    if (result[fieldName]) continue;
    const isSensitive = declared.sensitive === true || SENSITIVE_FIELD_RE.test(fieldName);
    result[fieldName] = {
      ...(declared.readRoles ? { readRoles: [...declared.readRoles] } : {}),
      ...(declared.writeRoles ? { writeRoles: [...declared.writeRoles] } : {}),
      ...(isSensitive ? { sensitive: true } : {}),
    };
  }
  return result;
}

export function assertWritableBodyFields(
  desc: RegisteredModelDescriptor,
  body: Record<string, unknown>,
  role: CrewRoleOrPublic,
): void {
  for (const [field, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (!canWriteField(desc, field, role)) {
      throw new PolicyError(
        `Write access to field '${field}' on '${desc.name}' is forbidden`,
        "FIELD_WRITE_FORBIDDEN",
        403,
      );
    }
  }
}

export function assertReadableFilterFields(
  desc: RegisteredModelDescriptor,
  fields: Iterable<string>,
  role: CrewRoleOrPublic,
): void {
  for (const field of fields) {
    if (!canReadField(desc, field, role)) {
      throw new PolicyError(
        `Read access to field '${field}' on '${desc.name}' is forbidden`,
        "FIELD_READ_FORBIDDEN",
        403,
      );
    }
  }
}

export function extractFilterFields(
  filter: Record<string, unknown> | null | undefined,
  out: Set<string> = new Set(),
): Set<string> {
  if (!filter) return out;
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined) continue;
    if (key === "$and" || key === "$or") {
      if (Array.isArray(value)) {
        for (const sub of value) {
          if (isPlainRecord(sub)) {
            extractFilterFields(sub, out);
          }
        }
      }
      continue;
    }
    if (key === "$not") {
      if (isPlainRecord(value)) {
        extractFilterFields(value, out);
      }
      continue;
    }
    out.add(key);
  }
  return out;
}

export function parseOrderByFields(orderBy?: string): string[] {
  if (!orderBy?.trim()) return [];
  const fields: string[] = [];
  for (const rawPart of orderBy.split(",")) {
    const tokens = rawPart.trim().split(/\s+/).filter(Boolean);
    if (tokens[0]) {
      fields.push(tokens[0]);
    }
  }
  return fields;
}

export function sanitizeRecordForRole(
  desc: RegisteredModelDescriptor | undefined,
  record: Record<string, unknown>,
  role: CrewRoleOrPublic,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("$") && key.length > 1) {
      const relName = key.slice(1);
      if (desc?.fields.has(relName) && !canReadField(desc, relName, role)) {
        continue;
      }
      const relSpec = desc?.relations?.[relName];
      const relDesc = relSpec ? modelRegistry.get(relSpec.model) : undefined;
      if (Array.isArray(value)) {
        out[key] = value.map((item) =>
          isPlainRecord(item) ? sanitizeRecordForRole(relDesc, item, role) : item,
        );
      } else if (isPlainRecord(value)) {
        out[key] = sanitizeRecordForRole(relDesc, value, role);
      } else {
        out[key] = value;
      }
      continue;
    }

    if (!canReadField(desc, key, role)) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function sanitizeActionResultForRole(
  desc: RegisteredModelDescriptor | undefined,
  result: unknown,
  role: CrewRoleOrPublic,
): unknown {
  if (result === null || result === undefined || typeof result !== "object") {
    return result;
  }
  if (result instanceof Date) {
    return result;
  }
  if (Array.isArray(result)) {
    return result.map((item) => sanitizeActionResultForRole(desc, item, role));
  }
  const sanitized = sanitizeRecordForRole(desc, result as Record<string, unknown>, role);
  for (const [key, value] of Object.entries(sanitized)) {
    if (key.startsWith("$")) continue;
    if (Array.isArray(value) || (isPlainRecord(value) && !(value instanceof Date))) {
      sanitized[key] = sanitizeActionResultForRole(undefined, value, role);
    }
  }
  return sanitized;
}

export function sanitizeHistoryEntriesForRole<T extends { diff: unknown }>(
  desc: RegisteredModelDescriptor,
  entries: T[],
  role: CrewRoleOrPublic,
): T[] {
  return entries.map((entry) => {
    const rawDiff = entry.diff;
    let parsed: unknown = rawDiff;
    if (typeof rawDiff === "string") {
      try {
        parsed = JSON.parse(rawDiff);
      } catch {
        return entry;
      }
    }
    if (!isPlainRecord(parsed)) {
      return entry;
    }
    const filteredDiff: Record<string, unknown> = {};
    for (const [field, change] of Object.entries(parsed)) {
      if (canReadField(desc, field, role)) {
        filteredDiff[field] = change;
      }
    }
    return {
      ...entry,
      diff: typeof rawDiff === "string" ? JSON.stringify(filteredDiff) : filteredDiff,
    };
  });
}
