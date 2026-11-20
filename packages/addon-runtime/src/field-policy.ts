import {
  modelRegistry,
  PolicyError,
  type FieldPolicySpec,
  type RegisteredModelDescriptor,
} from "@moonwitness/orm";

export type CrewRoleOrPublic = "admin" | "editor" | "viewer" | "public";

export const SENSITIVE_FIELD_RE = /password_hash|_token|_secret|encrypted_private/i;

export const DEFAULT_ROLE_BASE_GROUPS: Record<CrewRoleOrPublic, string[]> = {
  public: ["base.group_public"],
  viewer: ["base.group_viewer", "base.group_public"],
  editor: ["base.group_editor", "base.group_viewer", "base.group_public"],
  admin: ["base.group_system", "base.group_editor", "base.group_viewer", "base.group_public"],
};

export const BUILTIN_IMPLIED_GROUPS: Record<string, string[]> = {
  "base.group_system": ["base.group_editor"],
  "base.group_editor": ["base.group_viewer"],
  "base.group_viewer": ["base.group_public"],
  "base.group_public": [],
};

/**
 * Resolves the effective group set for an actor by expanding their role's base
 * group and any explicit `actorGroups` across `res.groups` implications.
 */
export function resolveEffectiveGroups(
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): Set<string> {
  const effective = new Set<string>(DEFAULT_ROLE_BASE_GROUPS[role] ?? ["base.group_public"]);
  const queue: string[] = [...effective];
  for (const g of actorGroups ?? []) {
    const trimmed = g.trim();
    if (trimmed && !effective.has(trimmed)) {
      effective.add(trimmed);
      queue.push(trimmed);
    }
  }
  while (queue.length > 0) {
    const current = queue.shift()!;
    const nextGroups = impliedGroups?.get(current) ?? BUILTIN_IMPLIED_GROUPS[current] ?? [];
    for (const implied of nextGroups) {
      if (!effective.has(implied)) {
        effective.add(implied);
        queue.push(implied);
      }
    }
  }
  return effective;
}

function toEffectiveGroupSet(
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): Set<string> {
  if (actorGroups instanceof Set) {
    return actorGroups;
  }
  return resolveEffectiveGroups(role, actorGroups, impliedGroups);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)
  );
}

/**
 * Returns true when `role` or `actorGroups` is permitted to read `field` on `desc`.
 *
 * Matching semantics: when `readRoles` and/or `readGroups` is configured,
 * an allowed role OR an effective actor-group match grants access; otherwise
 * access is denied. When no read allowlist is configured, sensitive fields
 * remain denied by default.
 */
export function canReadField(
  desc: RegisteredModelDescriptor | undefined,
  field: string,
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): boolean {
  const policy = desc?.fieldPolicies?.[field];
  const hasReadAllowlist = policy?.readRoles !== undefined || policy?.readGroups !== undefined;
  if (hasReadAllowlist) {
    const roleAllowed = policy?.readRoles !== undefined && policy.readRoles.includes(role);
    if (roleAllowed) return true;
    if (policy?.readGroups !== undefined) {
      const effectiveGroups = toEffectiveGroupSet(role, actorGroups, impliedGroups);
      if (policy.readGroups.some((g) => effectiveGroups.has(g))) {
        return true;
      }
    }
    return false;
  }
  if (policy?.sensitive === true || SENSITIVE_FIELD_RE.test(field)) {
    return false;
  }
  return true;
}

/**
 * Returns true when `role` or `actorGroups` is permitted to write `field` on `desc`.
 *
 * Matching semantics: when `writeRoles` and/or `writeGroups` is configured,
 * an allowed role OR an effective actor-group match grants access; otherwise
 * access is denied. When no write allowlist is configured, sensitive fields
 * remain denied by default.
 */
export function canWriteField(
  desc: RegisteredModelDescriptor | undefined,
  field: string,
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): boolean {
  const policy = desc?.fieldPolicies?.[field];
  const hasWriteAllowlist = policy?.writeRoles !== undefined || policy?.writeGroups !== undefined;
  if (hasWriteAllowlist) {
    const roleAllowed = policy?.writeRoles !== undefined && policy.writeRoles.includes(role);
    if (roleAllowed) return true;
    if (policy?.writeGroups !== undefined) {
      const effectiveGroups = toEffectiveGroupSet(role, actorGroups, impliedGroups);
      if (policy.writeGroups.some((g) => effectiveGroups.has(g))) {
        return true;
      }
    }
    return false;
  }
  if (policy?.sensitive === true || SENSITIVE_FIELD_RE.test(field)) {
    return false;
  }
  return true;
}

/** Returns true when the caller may read and hydrate `relName` on `desc`. */
export function canReadRelation(
  desc: RegisteredModelDescriptor | undefined,
  relName: string,
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): boolean {
  const effectiveGroups = toEffectiveGroupSet(role, actorGroups, impliedGroups);
  if (
    (desc?.fields.has(relName) || desc?.fieldPolicies?.[relName] !== undefined) &&
    !canReadField(desc, relName, role, effectiveGroups)
  ) {
    return false;
  }
  const relSpec = desc?.relations?.[relName];
  if (relSpec) {
    const fkField =
      relSpec.sourceKey ?? (desc?.fields.has(`${relName}_id`) ? `${relName}_id` : undefined);
    if (fkField && !canReadField(desc, fkField, role, effectiveGroups, impliedGroups)) {
      return false;
    }
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
      ...(declared?.readGroups ? { readGroups: [...declared.readGroups] } : {}),
      ...(declared?.writeGroups ? { writeGroups: [...declared.writeGroups] } : {}),
      ...(isSensitive ? { sensitive: true } : {}),
    };
  }
  for (const [fieldName, declared] of Object.entries(desc.fieldPolicies ?? {})) {
    if (result[fieldName]) continue;
    const isSensitive = declared.sensitive === true || SENSITIVE_FIELD_RE.test(fieldName);
    result[fieldName] = {
      ...(declared.readRoles ? { readRoles: [...declared.readRoles] } : {}),
      ...(declared.writeRoles ? { writeRoles: [...declared.writeRoles] } : {}),
      ...(declared.readGroups ? { readGroups: [...declared.readGroups] } : {}),
      ...(declared.writeGroups ? { writeGroups: [...declared.writeGroups] } : {}),
      ...(isSensitive ? { sensitive: true } : {}),
    };
  }
  return result;
}

export function assertWritableBodyFields(
  desc: RegisteredModelDescriptor,
  body: Record<string, unknown>,
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): void {
  const effectiveGroups = toEffectiveGroupSet(role, actorGroups, impliedGroups);
  for (const [field, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (!canWriteField(desc, field, role, effectiveGroups, impliedGroups)) {
      throw new PolicyError(
        "Write access to field '" + field + "' on '" + desc.name + "' is forbidden",
        "FIELD_WRITE_FORBIDDEN",
        403,
      );
    }
  }
}

export function assertWritableActionInputFields(
  desc: RegisteredModelDescriptor,
  input: unknown,
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
  depth = 0,
): void {
  if (depth > 8 || input === null || input === undefined || typeof input !== "object") {
    return;
  }
  if (Array.isArray(input)) {
    for (const item of input) {
      assertWritableActionInputFields(desc, item, role, actorGroups, impliedGroups, depth + 1);
    }
    return;
  }
  if (!isPlainRecord(input)) {
    return;
  }
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const isKnownModelField =
      desc.fields.has(key) ||
      desc.fieldPolicies?.[key] !== undefined ||
      SENSITIVE_FIELD_RE.test(key);
    if (isKnownModelField && !canWriteField(desc, key, role, actorGroups, impliedGroups)) {
      throw new PolicyError(
        "Write access to field '" + key + "' on '" + desc.name + "' is forbidden",
        "FIELD_WRITE_FORBIDDEN",
        403,
      );
    }
    if (Array.isArray(value) || isPlainRecord(value)) {
      assertWritableActionInputFields(desc, value, role, actorGroups, impliedGroups, depth + 1);
    }
  }
}

export function assertReadableFilterFields(
  desc: RegisteredModelDescriptor,
  fields: Iterable<string>,
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): void {
  const effectiveGroups = toEffectiveGroupSet(role, actorGroups, impliedGroups);
  for (const field of fields) {
    if (!canReadField(desc, field, role, effectiveGroups, impliedGroups)) {
      throw new PolicyError(
        "Read access to field '" + field + "' on '" + desc.name + "' is forbidden",
        "FIELD_READ_FORBIDDEN",
        403,
      );
    }
  }
}

export function assertReadableRelations(
  desc: RegisteredModelDescriptor,
  relations: Iterable<string> | undefined,
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): void {
  if (!relations) return;
  const effectiveGroups = toEffectiveGroupSet(role, actorGroups, impliedGroups);
  for (const relPath of relations) {
    let currentDesc: RegisteredModelDescriptor | undefined = desc;
    for (const seg of relPath.split(".").filter(Boolean)) {
      if (!canReadRelation(currentDesc, seg, role, effectiveGroups, impliedGroups)) {
        throw new PolicyError(
          "Read access to field '" + seg + "' on '" + (currentDesc?.name ?? desc.name) + "' is forbidden",
          "FIELD_READ_FORBIDDEN",
          403,
        );
      }
      const nextModel: string | undefined = currentDesc?.relations?.[seg]?.model;
      currentDesc = nextModel ? modelRegistry.get(nextModel) : undefined;
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
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): Record<string, unknown> {
  const effectiveGroups = toEffectiveGroupSet(role, actorGroups, impliedGroups);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("$") && key.length > 1) {
      const relName = key.slice(1);
      if (!canReadRelation(desc, relName, role, effectiveGroups, impliedGroups)) {
        continue;
      }
      const relSpec = desc?.relations?.[relName];
      const relDesc = relSpec ? modelRegistry.get(relSpec.model) : undefined;
      if (Array.isArray(value)) {
        out[key] = value.map((item) =>
          isPlainRecord(item)
            ? sanitizeRecordForRole(relDesc, item, role, effectiveGroups, impliedGroups)
            : item,
        );
      } else if (isPlainRecord(value)) {
        out[key] = sanitizeRecordForRole(relDesc, value, role, effectiveGroups, impliedGroups);
      } else {
        out[key] = value;
      }
      continue;
    }

    if (!canReadField(desc, key, role, effectiveGroups, impliedGroups)) {
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
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): unknown {
  if (result === null || result === undefined || typeof result !== "object") {
    return result;
  }
  if (result instanceof Date) {
    return result;
  }
  const effectiveGroups = toEffectiveGroupSet(role, actorGroups, impliedGroups);
  if (Array.isArray(result)) {
    return result.map((item) => sanitizeActionResultForRole(desc, item, role, effectiveGroups));
  }
  const sanitized = sanitizeRecordForRole(
    desc,
    result as Record<string, unknown>,
    role,
    effectiveGroups,
    impliedGroups,
  );
  for (const [key, value] of Object.entries(sanitized)) {
    if (key.startsWith("$")) continue;
    if (Array.isArray(value) || (isPlainRecord(value) && !(value instanceof Date))) {
      sanitized[key] = sanitizeActionResultForRole(
        undefined,
        value,
        role,
        effectiveGroups,
        impliedGroups,
      );
    }
  }
  return sanitized;
}

export function sanitizeHistoryEntriesForRole<T extends { diff: unknown }>(
  desc: RegisteredModelDescriptor,
  entries: T[],
  role: CrewRoleOrPublic,
  actorGroups?: Iterable<string>,
  impliedGroups?: Map<string, string[]>,
): T[] {
  const effectiveGroups = toEffectiveGroupSet(role, actorGroups, impliedGroups);
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
      if (canReadField(desc, field, role, effectiveGroups, impliedGroups)) {
        filteredDiff[field] = change;
      }
    }
    return {
      ...entry,
      diff: typeof rawDiff === "string" ? JSON.stringify(filteredDiff) : filteredDiff,
    };
  });
}
