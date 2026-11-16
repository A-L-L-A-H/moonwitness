import assert from "node:assert/strict";
import test from "node:test";
import {
  registeredAepCapabilities,
  resolveAepCapability,
} from "../dist/services/aep-capabilities.js";

test("AEP capability resolver canonicalizes registered aliases", () => {
  const canonical = resolveAepCapability("ai.chat");
  const alias = resolveAepCapability("chat");
  assert.ok(canonical);
  assert.equal(canonical.executorKey, "ai.chat");
  assert.equal(alias?.id, "ai.chat");
  assert.deepEqual(registeredAepCapabilities(), [
    "ai.chat",
    "mail.send",
    "chat.send",
    "notifications.watch",
    "projects.list", "projects.get", "projects.watch", "projects.create", "projects.update", "projects.delete",
    "tasks.list", "tasks.get", "tasks.watch", "tasks.create", "tasks.update", "tasks.delete",
  ]);
});

test("resource capabilities retain action and resource authorization metadata", () => {
  const list = resolveAepCapability("projects.list");
  const update = resolveAepCapability("tasks.update");
  assert.equal(list?.resource, "projects");
  assert.equal(list?.action, "read");
  assert.equal(update?.resource, "tasks");
  assert.equal(update?.action, "update");
  assert.equal(list?.input.safeParse({ search: "rocksoul" }).success, true);
  assert.equal(resolveAepCapability("tasks.get")?.input.safeParse({}).success, false);
  assert.equal(resolveAepCapability("tasks.update")?.input.safeParse({ id: "task-1", title: "Updated" }).success, true);
});

test("AEP capability resolver validates input and fails closed", () => {
  const capability = resolveAepCapability("ai.chat");
  assert.ok(capability);
  assert.equal(capability.input.safeParse({ prompt: "hello" }).success, true);
  assert.equal(capability.input.safeParse({ prompt: "" }).success, false);
  assert.equal(resolveAepCapability("unknown.capability"), undefined);
});

test("mail send is a scoped, validated mutation capability", () => {
  const capability = resolveAepCapability("mail.send");
  assert.equal(capability?.resource, "mails");
  assert.equal(capability?.action, "create");
  assert.equal(capability?.input.safeParse({ to: "user@example.com", text: "hello" }).success, true);
  assert.equal(capability?.input.safeParse({ to: "not-an-email", text: "hello" }).success, false);
});
