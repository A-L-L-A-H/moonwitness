export type SchemaCompatibility = 'exact' | 'backward' | 'forward';
export type SchemaField = { readonly required: boolean; readonly optional?: boolean };
export type ApplicationSchema = {
  readonly schemaId: string;
  readonly schemaVersion: string;
  readonly compatibility: SchemaCompatibility;
  readonly fields: Readonly<Record<string, SchemaField>>;
};

export type SchemaNegotiation =
  | { readonly status: 'compatible'; readonly schema: ApplicationSchema }
  | { readonly status: 'incompatible'; readonly reason: 'SCHEMA_ID_MISMATCH' | 'VERSION_MISMATCH' | 'REQUIRED_FIELD_MISMATCH' };

const versionParts = (version: string) => version.split('.').map(Number);
const sameMajor = (left: string, right: string) => versionParts(left)[0] === versionParts(right)[0];

/** Negotiates application schemas without exposing protocol frames or transport details. */
export function negotiateSchema(client: ApplicationSchema, server: ApplicationSchema): SchemaNegotiation {
  if (client.schemaId !== server.schemaId) return { status: 'incompatible', reason: 'SCHEMA_ID_MISMATCH' };
  if (client.schemaVersion !== server.schemaVersion && (!sameMajor(client.schemaVersion, server.schemaVersion) || client.compatibility === 'exact')) return { status: 'incompatible', reason: 'VERSION_MISMATCH' };
  for (const [name, field] of Object.entries(client.fields)) {
    if (field.required && !server.fields[name]?.required) return { status: 'incompatible', reason: 'REQUIRED_FIELD_MISMATCH' };
  }
  return { status: 'compatible', schema: server };
}

export function validateSchemaIdentity(schema: ApplicationSchema): void {
  if (!schema.schemaId.trim() || !/^\d+\.\d+\.\d+$/.test(schema.schemaVersion)) throw new Error('invalid application schema identity');
}
