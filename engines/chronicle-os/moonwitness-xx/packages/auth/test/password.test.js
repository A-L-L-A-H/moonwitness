import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/password.js";

test("passwords are hashed using Argon2id and verified", async () => {
  const hash = await hashPassword("correct horse battery staple");

  assert.notEqual(hash, "correct horse battery staple");
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  assert.equal(await verifyPassword("incorrect password value", hash), false);
});

test("password hashing rejects weak and oversized values", async () => {
  await assert.rejects(() => hashPassword("short"), /12 and 128/);
  await assert.rejects(() => hashPassword("x".repeat(129)), /12 and 128/);
});
