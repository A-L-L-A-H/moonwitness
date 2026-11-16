import { z } from "zod";

export const aepChatInputSchema = z.object({
  prompt: z.string().min(1).max(32_000),
  threadId: z.string().optional(),
  agentId: z.string().optional(),
  projectId: z.string().optional(),
  repositoryId: z.string().optional(),
  workspaceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  stream: z.boolean().optional(),
});

export type AepCapabilityDefinition = {
  readonly id: string;
  readonly executorKey: string;
  readonly input: z.ZodTypeAny;
  readonly resource?: string;
  readonly action?: 'read' | 'create' | 'update' | 'delete';
};

const resourceInput = z.record(z.unknown());
const resourceListInput = z.object({
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(1_000).optional(),
  order: z.string().max(100).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
}).passthrough();
const resourceIdInput = z.object({ id: z.string().min(1).max(256) }).passthrough();
const notificationWatchInput = z.object({ id: z.string().min(1).max(256).optional(), cursor: z.string().min(1).optional() }).passthrough();
export const aepMailSendInputSchema = z.object({
  to: z.string().email().max(320),
  subject: z.string().max(500).default(''),
  text: z.string().min(1).max(100_000),
  draft: z.boolean().default(false),
});
export const aepChatSendInputSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(100_000),
  type: z.enum(['text', 'image', 'file']).default('text'),
});
const flowDefinitionInput = z.object({ nodes: z.array(z.unknown()).max(100), edges: z.array(z.unknown()).max(200) });
const flowIdInput = z.object({ id: z.string().uuid() });
const flowCreateInput = z.object({ name: z.string().min(1).max(200), description: z.string().max(2000).optional(), definition: flowDefinitionInput.optional() });
const flowUpdateInput = flowIdInput.extend({ name: z.string().min(1).max(200).optional(), description: z.string().max(2000).nullable().optional(), definition: flowDefinitionInput.optional(), status: z.enum(['draft', 'active', 'paused', 'archived']).optional() });
const webhookEndpointInput = z.object({ name: z.string().min(1).max(200), url: z.string().url().max(2048), secret: z.string().min(1).max(4096).optional() });
const resourceDefinitions: Array<readonly [string, AepCapabilityDefinition]> = ['projects', 'tasks'].flatMap((resource) => (
  [
    ['list', 'read', resourceListInput], ['get', 'read', resourceIdInput], ['watch', 'read', notificationWatchInput],
    ['create', 'create', resourceInput], ['update', 'update', resourceIdInput], ['delete', 'delete', resourceIdInput],
  ] as const
).map(([operation, action, input]) => [
  `${resource}.${operation}`,
  { id: `${resource}.${operation}`, executorKey: `${resource}.${operation}`, input: input as z.ZodTypeAny, resource, action: action as 'read' | 'create' | 'update' | 'delete' },
] as const));

const definitions = new Map<string, AepCapabilityDefinition>([
  ["flow.list", { id: "flow.list", executorKey: "flow.list", input: z.object({}) }],
  ["flow.get", { id: "flow.get", executorKey: "flow.get", input: flowIdInput }],
  ["flow.create", { id: "flow.create", executorKey: "flow.create", input: flowCreateInput, resource: "flows", action: "create" }],
  ["flow.update", { id: "flow.update", executorKey: "flow.update", input: flowUpdateInput, resource: "flows", action: "update" }],
  ["flow.delete", { id: "flow.delete", executorKey: "flow.delete", input: flowIdInput, resource: "flows", action: "delete" }],
  ["flow.validate", { id: "flow.validate", executorKey: "flow.validate", input: flowIdInput, resource: "flows", action: "read" }],
  ["flow.publish", { id: "flow.publish", executorKey: "flow.publish", input: flowIdInput, resource: "flows", action: "update" }],
  ["flow.run", { id: "flow.run", executorKey: "flow.run", input: flowIdInput, resource: "flows", action: "update" }],
  ["flow.cancel", { id: "flow.cancel", executorKey: "flow.cancel", input: flowIdInput.extend({ executionId: z.string().min(1).optional() }), resource: "flows", action: "update" }],
  ["flow.executions", { id: "flow.executions", executorKey: "flow.executions", input: flowIdInput, resource: "flows", action: "read" }],
  ["flow.nodes.list", { id: "flow.nodes.list", executorKey: "flow.nodes.list", input: z.object({}) }],
  ["webhooks.endpoint.list", { id: "webhooks.endpoint.list", executorKey: "webhooks.endpoint.list", input: z.object({}) }],
  ["webhooks.endpoint.create", { id: "webhooks.endpoint.create", executorKey: "webhooks.endpoint.create", input: webhookEndpointInput, resource: "webhooks", action: "create" }],
  ["webhooks.endpoint.delete", { id: "webhooks.endpoint.delete", executorKey: "webhooks.endpoint.delete", input: resourceIdInput, resource: "webhooks", action: "delete" }],
  ["webhooks.subscription.create", { id: "webhooks.subscription.create", executorKey: "webhooks.subscription.create", input: resourceIdInput.extend({ eventPattern: z.string().min(1).max(200) }), resource: "webhooks", action: "update" }],
  ["ai.chat", { id: "ai.chat", executorKey: "ai.chat", input: aepChatInputSchema }],
  ["mail.send", { id: "mail.send", executorKey: "mail.send", input: aepMailSendInputSchema, resource: "mails", action: "create" }],
  ["chat.send", { id: "chat.send", executorKey: "chat.send", input: aepChatSendInputSchema, resource: "chat_messages", action: "create" }],
  ["notifications.watch", { id: "notifications.watch", executorKey: "notifications.watch", input: notificationWatchInput, resource: "notifications", action: "read" }],
  ["chat", { id: "ai.chat", executorKey: "ai.chat", input: aepChatInputSchema }],
  ...resourceDefinitions,
]);

/** Server-owned resolver. Unknown capability IDs never reach an executor. */
export const resolveAepCapability = (capabilityId: string) =>
  definitions.get(capabilityId);

export const registeredAepCapabilities = () =>
  [...new Set([...definitions.values()].map((definition) => definition.id))];
