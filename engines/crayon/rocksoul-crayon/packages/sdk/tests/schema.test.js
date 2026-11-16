import test from 'node:test';
import assert from 'node:assert/strict';
import { negotiateSchema, validateSchemaIdentity } from '../dist/index.js';

const schema = (version, fields = { id: { required: true } }) => ({ schemaId: 'project', schemaVersion: version, compatibility: 'backward', fields });

test('schema negotiation accepts compatible minor evolution and ignores unknown optional server fields', () => {
  const result = negotiateSchema(schema('1.0.0'), schema('1.1.0', { id: { required: true }, name: { required: false, optional: true } }));
  assert.equal(result.status, 'compatible');
});

test('schema negotiation fails closed for identity, major, exact, and required-field mismatches', () => {
  assert.equal(negotiateSchema(schema('1.0.0'), { ...schema('2.0.0'), schemaId: 'task' }).reason, 'SCHEMA_ID_MISMATCH');
  assert.equal(negotiateSchema(schema('1.0.0'), schema('2.0.0')).reason, 'VERSION_MISMATCH');
  assert.equal(negotiateSchema({ ...schema('1.0.0'), compatibility: 'exact' }, schema('1.1.0')).reason, 'VERSION_MISMATCH');
  assert.equal(negotiateSchema(schema('1.0.0'), schema('1.1.0', { id: { required: false } })).reason, 'REQUIRED_FIELD_MISMATCH');
  assert.throws(() => validateSchemaIdentity(schema('bad')), /invalid/);
});
