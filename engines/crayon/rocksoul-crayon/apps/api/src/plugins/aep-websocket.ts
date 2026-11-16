import websocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { ai } from "@rocksoul/ai-base";
import {
  FrameDecoder,
  FrameType,
  MAGIC,
  Priority,
  encodeFrame,
  messagePackSerializer,
  sequenceNext,
  validatePayload,
  validateSequence,
} from "@rocksoul/protocol";
import {
  and,
  eq,
  executionRecords,
  aepSessions,
  hashApiKey,
  modelRegistry,
  ModelConflictError,
  ModelCrud,
} from "@rocksoul/orm";
import { authorize } from "../security/authorization.js";
import { resolveAepCapability } from "../services/aep-capabilities.js";
import { aepEventHub } from "../services/aep-events.js";
import { createNotification } from "../routes/v1/notifications.js";
import { flowRequest } from "../services/flow-client.js";
import { webhookRequest } from "../services/webhooks-client.js";

const MAX_IN_FLIGHT_PER_STREAM = 64;

function resourceExecutionFailure(error: unknown) {
  if (error instanceof ModelConflictError) {
    return {
      code: error.code,
      message: 'The record changed before your update was applied',
      details: { id: error.recordId, expectedVersion: error.expectedVersion, actualVersion: error.actualVersion },
    };
  }
  return { code: 'EXECUTION_FAILED', message: 'Execution failed' };
}
const MAX_RATE_BYTES_PER_WINDOW = 2_097_152;
const MAX_RATE_MESSAGES_PER_WINDOW = 256;
const RATE_WINDOW_MS = 1_000;
const MAX_OUTBOUND_BYTES_PER_STREAM = 2_097_152;
type ReplayEntry = { streamId: number; sequence: number; createdAt: number; bytes: Uint8Array };
const replayBySession = new Map<string, ReplayEntry[]>();

/**
 * AEP gateway boundary: authentication, authorization, bounded dispatch, and
 * adaptation to canonical application services live here; the protocol package
 * remains transport- and domain-neutral.
 */
export async function registerAepWebSocket(
  app: FastifyInstance,
): Promise<void> {
  await app.register(websocket);
  app.get(
    "/aep",
    { websocket: true, preValidation: [app.authenticate] },
    (socket, request) => {
      // Authentication at upgrade time is necessary but not sufficient: AEP
      // sessions must be bound to the normalized server principal.
      if (!request.principal) {
        socket.close(1008, "authenticated principal required");
        return;
      }
      const principal = request.principal;
      const decoder = new FrameDecoder(messagePackSerializer);
      let negotiated = false;
      const incomingSequences = new Map<number, number>();
      const outgoingSequences = new Map<number, number>();
      const nextOutgoing = (streamId: number) => {
        const sequence = outgoingSequences.get(streamId) ?? 0;
        outgoingSequences.set(streamId, sequenceNext(sequence));
        return sequence;
      };
      let sessionId = "";
      const executions = new Map<string, string>();
      const executionControllers = new Map<string, AbortController>();
      const cancelled = new Set<string>();
      const inFlight = new Map<number, number>();
      const pendingOutboundBytes = new Map<number, number>();
      const subscriptionCleanups = new Set<() => void>();
      let rateWindowStarted = Date.now();
      let rateBytes = 0;
      let rateMessages = 0;
      const send = (
        frameType: FrameType,
        streamId: number,
        payload: unknown,
        acknowledgement: number,
        priority: Priority,
        flags = 0,
      ) => {
        const sequence = nextOutgoing(streamId);
        const bytes = encodeFrame(
            {
              header: {
                magic: MAGIC,
                protocolVersion: 1,
                frameType,
                flags,
                streamId,
                sequence,
                acknowledgement,
                timestamp: BigInt(Date.now()),
                priority,
                payloadLength: 0,
              },
              payload,
            },
            messagePackSerializer,
          );
        const pending = pendingOutboundBytes.get(streamId) ?? 0;
        if (pending + bytes.byteLength > MAX_OUTBOUND_BYTES_PER_STREAM) {
          socket.close(1008, "outbound backpressure limit exceeded");
          return;
        }
        pendingOutboundBytes.set(streamId, pending + bytes.byteLength);
        socket.send(bytes, () => {
          pendingOutboundBytes.set(
            streamId,
            Math.max(0, (pendingOutboundBytes.get(streamId) ?? bytes.byteLength) - bytes.byteLength),
          );
        });
        if (frameType === FrameType.DATA && sessionId) {
          const entries = replayBySession.get(sessionId) ?? [];
          const now = Date.now();
          entries.push({ streamId, sequence, createdAt: now, bytes });
          replayBySession.set(sessionId, entries.filter((entry) => now - entry.createdAt <= 60_000).slice(-256));
        }
      };
      const closeProtocol = (code: string) => {
        try {
          send(
            FrameType.CLOSE,
            0,
            { code },
            incomingSequences.get(0) ?? 0,
            Priority.CRITICAL,
          );
        } finally {
          socket.close(1008, "protocol request rejected");
        }
      };
      socket.on("message", async (raw: unknown) => {
        try {
          const view = raw as ArrayBufferView;
          const bytes =
            raw instanceof Uint8Array
              ? new Uint8Array(raw)
              : raw instanceof ArrayBuffer
                ? new Uint8Array(raw)
                : new Uint8Array(
                    view.buffer as ArrayBuffer,
                    view.byteOffset,
                    view.byteLength,
                  );
          const now = Date.now();
          if (now - rateWindowStarted >= RATE_WINDOW_MS) {
            rateWindowStarted = now;
            rateBytes = 0;
            rateMessages = 0;
          }
          rateBytes += bytes.byteLength;
          rateMessages += 1;
          if (
            rateBytes > MAX_RATE_BYTES_PER_WINDOW ||
            rateMessages > MAX_RATE_MESSAGES_PER_WINDOW
          ) {
            closeProtocol("RATE_LIMITED");
            return;
          }
          for (const frame of decoder.push(bytes)) {
            validatePayload(
              frame.header.frameType,
              frame.payload,
              frame.header,
            );
            const expected = incomingSequences.get(frame.header.streamId) ?? 0;
            const order = validateSequence(expected, frame.header.sequence);
            if (order === "duplicate") continue;
            incomingSequences.set(frame.header.streamId, frame.header.sequence);
            if (!negotiated) {
              const hello = frame.payload as {
                helloKind?: string;
                mode?: string;
                serializers?: unknown[];
                sessionId?: string;
                resumeToken?: string;
                lastAckSeq?: number;
              };
              if (
                frame.header.frameType !== FrameType.HELLO ||
                hello.helloKind !== "REQUEST" ||
                !hello.serializers?.includes("msgpack")
              )
                throw new Error("HELLO request is required");
              negotiated = true;
              if (hello.mode === "RESUME") {
                const record = (
                  await app.db
                    .select()
                    .from(aepSessions)
                    .where(
                      and(
                        eq(aepSessions.id, hello.sessionId || ""),
                        eq(aepSessions.userId, principal.userId),
                        eq(
                          aepSessions.resumeTokenHash,
                          hashApiKey(hello.resumeToken || ""),
                        ),
                        eq(aepSessions.isRevoked, false),
                      ),
                    )
                    .limit(1)
                )[0];
                if (!record || new Date(record.expiresAt) <= new Date()) {
                  send(
                    FrameType.HELLO,
                    0,
                    {
                      helloKind: "WELCOME",
                      sessionId: hello.sessionId || "unknown",
                      negotiatedSerializer: "msgpack",
                      resume: {
                        status: "REJECTED",
                        delivery: "NONE",
                        reasonCode: "SESSION_EXPIRED",
                      },
                    },
                    frame.header.sequence,
                    Priority.CRITICAL,
                  );
                  closeProtocol("SESSION_EXPIRED");
                  continue;
                }
                sessionId = record.id;
                const replacementToken = randomUUID();
                const now = new Date();
                const expires = new Date(
                  now.getTime() + 24 * 60 * 60 * 1000,
                ).toISOString();
                await app.db
                  .update(aepSessions)
                  .set({
                    resumeTokenHash: hashApiKey(replacementToken),
                    expiresAt: expires,
                    replayUntil: new Date(now.getTime() + 60_000).toISOString(),
                    lastSeenAt: now.toISOString(),
                  })
                  .where(eq(aepSessions.id, record.id));
                const replayNow = Date.now();
                const replayAllowedUntil = new Date(record.replayUntil).getTime();
                const replay = replayNow <= replayAllowedUntil
                  ? (replayBySession.get(sessionId) ?? []).filter(
                      (entry) => replayNow - entry.createdAt <= 60_000 && entry.sequence > (hello.lastAckSeq ?? 0),
                    )
                  : [];
                outgoingSequences.set(0, 1);
                const snapshot = await app.db
                  .select()
                  .from(executionRecords)
                  .where(eq(executionRecords.actorId, principal.userId));
                send(
                  FrameType.HELLO,
                  0,
                  {
                    helloKind: "WELCOME",
                    sessionId,
                    resumeToken: replacementToken,
                    negotiatedSerializer: "msgpack",
                    resume: { status: "ACCEPTED", delivery: replay.length ? "REPLAY" : "SYNC_SNAPSHOT" },
                  },
                  frame.header.sequence,
                  Priority.CRITICAL,
                  replay.length ? 0 : 8,
                );
                if (replay.length) {
                  for (const entry of replay) {
                    outgoingSequences.set(entry.streamId, Math.max(outgoingSequences.get(entry.streamId) ?? 0, entry.sequence + 1));
                    socket.send(entry.bytes);
                  }
                } else {
                  send(FrameType.DATA, 0, { eventType: "session.snapshot", data: { executions: snapshot } }, frame.header.sequence, Priority.NORMAL, 8);
                }
              } else if (hello.mode === "INITIAL") {
                sessionId = `aep-${randomUUID()}`;
                const resumeToken = randomUUID();
                const now = new Date();
                await app.db
                  .insert(aepSessions)
                  .values({
                    id: sessionId,
                    userId: principal.userId,
                    resumeTokenHash: hashApiKey(resumeToken),
                    expiresAt: new Date(
                      now.getTime() + 24 * 60 * 60 * 1000,
                    ).toISOString(),
                    replayUntil: new Date(now.getTime() + 60_000).toISOString(),
                    lastSeenAt: now.toISOString(),
                    isRevoked: false,
                  });
                send(
                  FrameType.HELLO,
                  0,
                  {
                    helloKind: "WELCOME",
                    sessionId,
                    resumeToken,
                    negotiatedSerializer: "msgpack",
                  },
                  frame.header.sequence,
                  Priority.CRITICAL,
                );
              } else throw new Error("HELLO mode is invalid");
              continue;
            }
            if (frame.header.frameType === FrameType.RUN) {
              app.log.info({ streamId: frame.header.streamId, sequence: frame.header.sequence }, "AEP RUN received");
              const capabilityPreview = resolveAepCapability((frame.payload as { capabilityId?: string }).capabilityId || "");
              const decision = authorize(principal, capabilityPreview?.resource || "ai", capabilityPreview?.action || "create");
              if (!decision.allowed) {
                closeProtocol("AUTHORIZATION_DENIED");
                continue;
              }
              const payload = frame.payload as {
                capabilityId: string;
                input: unknown;
                executionId?: string;
                requestId?: string;
                idempotencyKey?: string;
              };
              const capability = resolveAepCapability(payload.capabilityId);
              app.log.info({ capabilityId: payload.capabilityId, found: Boolean(capability) }, "AEP capability resolved");
              if (!capability) {
                closeProtocol("CAPABILITY_NOT_FOUND");
                continue;
              }
              const parsed = capability.input.safeParse(payload.input);
              app.log.info({ capabilityId: capability.id, valid: parsed.success }, "AEP input validated");
              if (!parsed.success) {
                closeProtocol("INVALID_INPUT");
                continue;
              }
              if (!payload.idempotencyKey && capability.action !== "read") {
                closeProtocol("IDEMPOTENCY_REQUIRED");
                continue;
              }
              if (capability.id.endsWith(".watch") && capability.resource) {
                const resourceName = capability.resource;
                const executionId = payload.executionId || `aep-subscription-${randomUUID()}`;
                send(FrameType.ACK, frame.header.streamId, { streamId: frame.header.streamId, ackSeq: frame.header.sequence, executionId, state: "RUNNING" }, frame.header.sequence, Priority.HIGH);
                const filter = parsed.data as Record<string, unknown>;
                let eventSequence = 0;
                const requestedCursor = typeof filter.cursor === "string" ? filter.cursor : undefined;
                const recordFilter = typeof filter.id === "string" && filter.id !== "*" ? filter.id : undefined;
                const replay = aepEventHub.replay(requestedCursor, { resource: capability.resource, recordId: recordFilter, principalId: principal.userId });
                const cleanup = aepEventHub.subscribe(
                  { resource: capability.resource, recordId: recordFilter, principalId: principal.userId },
                  (event) => {
                    send(FrameType.DATA, frame.header.streamId, { eventId: event.eventId, eventType: event.eventType, sessionId, requestId: payload.requestId || `aep-request-${randomUUID()}`, executionId, sequence: eventSequence++, cursor: event.cursor, timestamp: event.timestamp, priority: Priority.NORMAL, payload: event.payload }, frame.header.sequence, Priority.NORMAL);
                  },
                  requestedCursor,
                );
                subscriptionCleanups.add(cleanup);
                if (replay.gap) {
                  send(FrameType.DATA, frame.header.streamId, { eventId: `gap-${randomUUID()}`, eventType: "subscription.snapshot_required", sessionId, requestId: payload.requestId || `aep-request-${randomUUID()}`, executionId, sequence: eventSequence++, cursor: requestedCursor, timestamp: Date.now(), priority: Priority.HIGH, payload: { reason: "CURSOR_GAP", resource: capability.resource } }, frame.header.sequence, Priority.HIGH);
                  const snapshotModel = modelRegistry.get(resourceName);
                  if (snapshotModel) {
                    const snapshot = typeof filter.id === "string"
                      ? await ModelCrud.findById(app.db, snapshotModel, filter.id)
                      : await ModelCrud.findMany(app.db, snapshotModel, { page: 1, limit: 100 });
                    send(FrameType.DATA, frame.header.streamId, { eventId: `snapshot-${randomUUID()}`, eventType: "subscription.snapshot", sessionId, requestId: payload.requestId || `aep-request-${randomUUID()}`, executionId, sequence: eventSequence++, cursor: requestedCursor, timestamp: Date.now(), priority: Priority.HIGH, payload: { resource: resourceName, data: snapshot } }, frame.header.sequence, Priority.HIGH);
                  }
                }
                continue;
              }
              const streamLoad = inFlight.get(frame.header.streamId) || 0;
              if (streamLoad >= MAX_IN_FLIGHT_PER_STREAM) {
                closeProtocol("STREAM_BACKPRESSURE");
                continue;
              }
              const executionId =
                payload.executionId || `aep-execution-${randomUUID()}`;
              const effectiveIdempotencyKey = payload.idempotencyKey || `aep-read-${randomUUID()}`;
              const actorId = principal.userId;
              const existing = (
                await app.db
                  .select()
                  .from(executionRecords)
                  .where(
                    and(
                      eq(executionRecords.actorId, actorId),
                      eq(executionRecords.capabilityId, capability.id),
                      eq(executionRecords.idempotencyKey, effectiveIdempotencyKey),
                    ),
                  )
                  .limit(1)
              )[0];
              if (existing) {
                send(
                  FrameType.ACK,
                  frame.header.streamId,
                  {
                    streamId: frame.header.streamId,
                    ackSeq: frame.header.sequence,
                    executionId: existing.id,
                    state: existing.status,
                  },
                  frame.header.sequence,
                  Priority.HIGH,
                );
                if (existing.status === "SUCCEEDED" && existing.resultJson) {
                  send(
                    FrameType.DATA,
                    frame.header.streamId,
                    {
                      eventType: "execution.completed",
                      executionId: existing.id,
                      state: "SUCCEEDED",
                      data: JSON.parse(existing.resultJson),
                    },
                    frame.header.sequence,
                    Priority.NORMAL,
                  );
                } else if (existing.status === "FAILED")
                  send(
                    FrameType.DATA,
                    frame.header.streamId,
                    {
                      eventType: "execution.failed",
                      executionId: existing.id,
                      state: "FAILED",
                      data: {
                        code: existing.errorCode || "EXECUTION_FAILED",
                        message: "Execution failed",
                      },
                    },
                    frame.header.sequence,
                    Priority.HIGH,
                  );
                continue;
              }
              try {
                await app.db
                  .insert(executionRecords)
                  .values({
                    id: executionId,
                    actorId,
                    sessionId,
                    capabilityId: capability.id,
                    idempotencyKey: effectiveIdempotencyKey,
                    inputJson: JSON.stringify(parsed.data),
                    status: "ACCEPTED",
                  });
              } catch {
                closeProtocol("IDEMPOTENCY_CONFLICT");
                continue;
              }
              inFlight.set(frame.header.streamId, streamLoad + 1);
              send(
                FrameType.ACK,
                frame.header.streamId,
                {
                  streamId: frame.header.streamId,
                  ackSeq: frame.header.sequence,
                  executionId,
                  state: "ACCEPTED",
                },
                frame.header.sequence,
                Priority.HIGH,
              );
              if (capability.id.startsWith("flow.") || capability.id.startsWith('webhooks.')) {
                send(FrameType.DATA, frame.header.streamId, { eventType: "execution.started", executionId, state: "RUNNING" }, frame.header.sequence, Priority.NORMAL);
                if (capability.id === 'flow.run') {
                  await app.db.update(executionRecords).set({ status: 'RUNNING' }).where(eq(executionRecords.id, executionId));
                }
                void (async () => {
                  try {
                    const input = parsed.data as Record<string, unknown>;
                    const assertOwner = async (id: string) => {
                      const flow = await flowRequest<any>(`/internal/flows/${encodeURIComponent(id)}`);
                      if (principal.role !== 'admin' && flow.ownerUserId !== principal.userId) throw new Error('Flow not found');
                      return flow;
                    };
                    let result: unknown;
                    if (capability.id.startsWith('webhooks.')) {
                      switch (capability.id) {
                        case 'webhooks.endpoint.list': result = await webhookRequest('/endpoints'); break;
                        case 'webhooks.endpoint.create': result = await webhookRequest('/endpoints', 'POST', { ...input, ownerType: 'user', ownerId: principal.userId }); break;
                        case 'webhooks.endpoint.delete': result = await webhookRequest(`/endpoints/${encodeURIComponent(String(input.id))}`, 'DELETE'); break;
                        case 'webhooks.subscription.create': result = await webhookRequest(`/endpoints/${encodeURIComponent(String(input.id))}/subscriptions`, 'POST', { eventPattern: input.eventPattern }); break;
                        default: throw new Error('Webhook operation is not available');
                      }
                    } else switch (capability.id) {
                      case 'flow.list': result = await flowRequest(`/internal/flows?ownerUserId=${encodeURIComponent(principal.role === 'admin' ? '' : principal.userId)}`); break;
                      case 'flow.nodes.list': result = await flowRequest('/internal/nodes'); break;
                      case 'flow.create': result = await flowRequest('/internal/flows', 'POST', { ...input, ownerUserId: principal.userId }); break;
                      case 'flow.get': await assertOwner(String(input.id)); result = await flowRequest(`/internal/flows/${encodeURIComponent(String(input.id))}`); break;
                      case 'flow.update': await assertOwner(String(input.id)); { const { id, ...change } = input; result = await flowRequest(`/internal/flows/${encodeURIComponent(String(id))}`, 'PATCH', change); } break;
                      case 'flow.delete': await assertOwner(String(input.id)); result = await flowRequest(`/internal/flows/${encodeURIComponent(String(input.id))}`, 'DELETE'); break;
                      case 'flow.validate': await assertOwner(String(input.id)); result = await flowRequest(`/internal/flows/${encodeURIComponent(String(input.id))}/validate`, 'POST'); break;
                      case 'flow.publish': await assertOwner(String(input.id)); result = await flowRequest(`/internal/flows/${encodeURIComponent(String(input.id))}/publish`, 'POST', { ownerUserId: principal.userId }); break;
                      case 'flow.run': await assertOwner(String(input.id)); result = await flowRequest(`/internal/flows/${encodeURIComponent(String(input.id))}/run`, 'POST', { executionId, ownerUserId: principal.userId, triggerType: 'manual', idempotencyKey: effectiveIdempotencyKey }); break;
                      case 'flow.executions': await assertOwner(String(input.id)); result = await flowRequest(`/internal/flows/${encodeURIComponent(String(input.id))}/executions`); break;
                      case 'flow.cancel': {
                        await assertOwner(String(input.id));
                        const targetExecutionId = String(input.executionId || '');
                        if (!targetExecutionId) throw new Error('Target execution ID is required');
                        result = await flowRequest(`/internal/flows/${encodeURIComponent(String(input.id))}/cancel`, 'POST', { executionId: targetExecutionId });
                        await app.db.update(executionRecords).set({ status: 'CANCELLED', completedAt: new Date().toISOString() }).where(and(eq(executionRecords.id, targetExecutionId), eq(executionRecords.actorId, principal.userId), eq(executionRecords.status, 'RUNNING')));
                        break;
                      }
                      default: throw new Error('Flow operation is not available');
                    }
                    await app.db.update(executionRecords).set({ status: "SUCCEEDED", resultJson: JSON.stringify(result), completedAt: new Date().toISOString() }).where(eq(executionRecords.id, executionId));
                    send(FrameType.DATA, frame.header.streamId, { eventType: "execution.completed", executionId, state: "SUCCEEDED", data: result }, frame.header.sequence, Priority.NORMAL);
                  } catch (error) {
                    app.log.error({ err: error, executionId, capability: capability.id }, 'AEP flow execution failed');
                    await app.db.update(executionRecords).set({ status: 'FAILED', errorCode: 'FLOW_EXECUTION_FAILED', completedAt: new Date().toISOString() }).where(eq(executionRecords.id, executionId));
                    send(FrameType.DATA, frame.header.streamId, { eventType: 'execution.failed', executionId, state: 'FAILED', data: { code: 'FLOW_EXECUTION_FAILED', message: 'Flow operation failed' } }, frame.header.sequence, Priority.HIGH);
                  } finally { inFlight.set(frame.header.streamId, Math.max(0, (inFlight.get(frame.header.streamId) || 1) - 1)); }
                })();
                continue;
              }
              if (capability.id === "mail.send") {
                app.log.info({ executionId, capability: capability.id }, "AEP mail executor started");
                send(FrameType.DATA, frame.header.streamId, { eventType: "execution.started", executionId, state: "RUNNING" }, frame.header.sequence, Priority.NORMAL);
                void (async () => {
                  try {
                    const input = parsed.data as { to: string; subject: string; text: string; draft: boolean };
                    const senderResult = await app.dbClient.execute({ sql: "SELECT email FROM users WHERE id = ?", args: [principal.userId] });
                    const sender = senderResult.rows[0] as unknown as { email?: string } | undefined;
                    if (!sender?.email) throw new Error("sender account not found");
                    const now = new Date().toISOString();
                    const id = `mail_${randomUUID()}`;
                    const folder = input.draft ? "draft" : "sent";
                    await app.dbClient.execute({ sql: "INSERT INTO mails (id, user_id, name, email, subject, text, folder, read, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [id, principal.userId, input.to.trim(), sender.email, input.subject.trim(), input.text.trim(), folder, 1, now, now, now] });
                    if (!input.draft) await createNotification(app, principal.userId, { kind: "activity", title: "Mail sent", message: `Your message to ${input.to.trim()} was added to Sent.`, href: "/mail?folder=sent" });
                    const result = { id, folder, date: now };
                    await app.db.update(executionRecords).set({ status: "SUCCEEDED", resultJson: JSON.stringify(result), completedAt: new Date().toISOString() }).where(eq(executionRecords.id, executionId));
                    send(FrameType.DATA, frame.header.streamId, { eventType: "execution.completed", executionId, state: "SUCCEEDED", data: result }, frame.header.sequence, Priority.NORMAL);
                  } catch (error) {
                    app.log.error({ err: error, executionId, capability: capability.id }, "AEP execution failed");
                    await app.db.update(executionRecords).set({ status: "FAILED", errorCode: "EXECUTION_FAILED", completedAt: new Date().toISOString() }).where(eq(executionRecords.id, executionId));
                    send(FrameType.DATA, frame.header.streamId, { eventType: "execution.failed", executionId, state: "FAILED", data: { code: "EXECUTION_FAILED", message: "Execution failed" } }, frame.header.sequence, Priority.HIGH);
                  } finally { inFlight.set(frame.header.streamId, Math.max(0, (inFlight.get(frame.header.streamId) || 1) - 1)); }
                })();
                continue;
              }
              if (capability.id === "chat.send") {
                void (async () => {
                  try {
                    const input = { ...(parsed.data as Record<string, unknown>), senderId: principal.userId };
                    const model = modelRegistry.get("chat_messages");
                    if (!model) throw new Error("chat message resource unavailable");
                    const result = await ModelCrud.create(app.db, model, input, principal.userId);
                    aepEventHub.publish({ eventId: randomUUID(), eventType: "resource.created", resource: "chat_messages", recordId: String((result as Record<string, unknown>).id ?? ""), timestamp: Date.now(), payload: result });
                    await app.db.update(executionRecords).set({ status: "SUCCEEDED", resultJson: JSON.stringify(result), completedAt: new Date().toISOString() }).where(eq(executionRecords.id, executionId));
                    send(FrameType.DATA, frame.header.streamId, { eventType: "execution.completed", executionId, state: "SUCCEEDED", data: result }, frame.header.sequence, Priority.NORMAL);
                  } catch (error) {
                    app.log.error({ err: error, executionId, capability: capability.id }, "AEP chat execution failed");
                    await app.db.update(executionRecords).set({ status: "FAILED", errorCode: "EXECUTION_FAILED", completedAt: new Date().toISOString() }).where(eq(executionRecords.id, executionId));
                    send(FrameType.DATA, frame.header.streamId, { eventType: "execution.failed", executionId, state: "FAILED", data: { code: "EXECUTION_FAILED", message: "Execution failed" } }, frame.header.sequence, Priority.HIGH);
                  } finally { inFlight.set(frame.header.streamId, Math.max(0, (inFlight.get(frame.header.streamId) || 1) - 1)); }
                })();
                continue;
              }
              if (capability.resource) {
                const resourceName = capability.resource;
                void (async () => {
                  try {
                    const model = modelRegistry.get(resourceName);
                    if (!model) throw new Error("resource unavailable");
                    const input = parsed.data as Record<string, unknown>;
                    let result: unknown;
                    if (capability.action === "read" && capability.id.endsWith(".list")) {
                      result = await ModelCrud.findMany(app.db, model, { page: Number(input.page || 1), limit: Number(input.limit || 20), search: typeof input.search === "string" ? input.search : undefined });
                    } else if (capability.action === "read") {
                      result = await ModelCrud.findById(app.db, model, String(input.id));
                    } else if (capability.action === "create") {
                      result = await ModelCrud.create(app.db, model, input, principal.userId);
                    } else if (capability.action === "update") {
                      const { id, expectedVersion, ...changes } = input;
                      result = await ModelCrud.update(app.db, model, String(id), changes, principal.userId, { expectedVersion: typeof expectedVersion === 'string' ? expectedVersion : undefined });
                    } else {
                      result = { id: String(input.id), deleted: await ModelCrud.delete(app.db, model, String(input.id)) };
                    }
                    if (capability.action !== "read") {
                      const eventType = capability.action === "create" ? "resource.created" : capability.action === "delete" ? "resource.deleted" : "resource.updated";
                      const resultRecord = result as Record<string, unknown>;
                      aepEventHub.publish({ eventId: randomUUID(), eventType, resource: resourceName, recordId: String(resultRecord.id ?? input.id ?? ""), timestamp: Date.now(), payload: result });
                    }
                    await app.db.update(executionRecords).set({ status: "SUCCEEDED", resultJson: JSON.stringify(result), completedAt: new Date().toISOString() }).where(eq(executionRecords.id, executionId));
                    send(FrameType.DATA, frame.header.streamId, { eventType: "execution.completed", executionId, state: "SUCCEEDED", data: result }, frame.header.sequence, Priority.NORMAL);
                  } catch (error) {
                    app.log.error({ err: error, executionId, capability: capability.id }, "AEP resource execution failed");
                    const failure = resourceExecutionFailure(error);
                    await app.db.update(executionRecords).set({ status: "FAILED", errorCode: failure.code, completedAt: new Date().toISOString() }).where(eq(executionRecords.id, executionId));
                    send(FrameType.DATA, frame.header.streamId, { eventType: "execution.failed", executionId, state: "FAILED", data: failure }, frame.header.sequence, Priority.HIGH);
                  } finally {
                    inFlight.set(frame.header.streamId, Math.max(0, (inFlight.get(frame.header.streamId) || 1) - 1));
                  }
                })();
                continue;
              }
              void (async () => {
                try {
                  const permissions = [...(principal.apiKeyScopes ?? [])];
                  const controller = new AbortController();
                  executionControllers.set(executionId, controller);
                  const context = {
                    executionId,
                    idempotencyKey: effectiveIdempotencyKey,
                    abortSignal: controller.signal,
                    requestId:
                      payload.requestId || `aep-request-${randomUUID()}`,
                    userId: principal.userId,
                    organizationId: request.user?.orgId || null,
                    projectId: parsed.data.projectId || null,
                    repositoryId: parsed.data.repositoryId || null,
                    workspaceId: parsed.data.workspaceId || null,
                    permissions,
                    metadata: {
                      source: "aep-websocket",
                      apiKeyId: request.apiKey?.id,
                      ...parsed.data.metadata,
                    },
                  };
                  aepEventHub.publish({ eventId: randomUUID(), eventType: 'ai.agent.started', resource: 'ai', recordId: executionId, principalId: principal.userId, timestamp: Date.now(), payload: { executionId, agentId: parsed.data.agentId || 'auto' } });
                  const run = parsed.data.stream ? await (async () => {
                    const chunks: string[] = [];
                    for await (const delta of ai.stream({ prompt: parsed.data.prompt, threadId: parsed.data.threadId, agentId: parsed.data.agentId, context })) {
                      chunks.push(delta);
                      const safe = delta.slice(0, 16_384);
                      aepEventHub.publish({ eventId: randomUUID(), eventType: 'ai.message.delta', resource: 'ai', recordId: executionId, principalId: principal.userId, timestamp: Date.now(), payload: { executionId, delta: safe } });
                      send(FrameType.DATA, frame.header.streamId, { eventType: 'ai.message.delta', executionId, data: { delta: safe } }, frame.header.sequence, Priority.NORMAL);
                    }
                    const agentRunId = randomUUID();
                    return { agentRunId, runId: agentRunId, agentId: parsed.data.agentId || 'assistant', status: 'completed', output: chunks.join(''), messages: [], createdAt: new Date().toISOString(), completedAt: new Date().toISOString(), metadata: { executionId: context.executionId, requestId: context.requestId } };
                  })() : await ai.chat({
                    prompt: parsed.data.prompt,
                    threadId: parsed.data.threadId,
                    agentId: parsed.data.agentId,
                    context,
                  });
                  executions.set(executionId, run.runId);
                  if (cancelled.has(executionId)) {
                    await app.db
                      .update(executionRecords)
                      .set({
                        status: "CANCELLED",
                        completedAt: new Date().toISOString(),
                      })
                      .where(eq(executionRecords.id, executionId));
                    return;
                  }
                  await app.db
                    .update(executionRecords)
                    .set({
                      status: "SUCCEEDED",
                      resultJson: JSON.stringify(run),
                      completedAt: new Date().toISOString(),
                    })
                    .where(eq(executionRecords.id, executionId));
                  aepEventHub.publish({ eventId: randomUUID(), eventType: 'ai.agent.completed', resource: 'ai', recordId: executionId, principalId: principal.userId, timestamp: Date.now(), payload: { executionId, agentRunId: run.agentRunId } });
                  send(
                    FrameType.DATA,
                    frame.header.streamId,
                    {
                      eventType: "execution.completed",
                      executionId,
                      state: "SUCCEEDED",
                      data: run,
                    },
                    frame.header.sequence,
                    Priority.NORMAL,
                  );
                } catch {
                  if (cancelled.has(executionId)) {
                    await app.db
                      .update(executionRecords)
                      .set({
                        status: "CANCELLED",
                        completedAt: new Date().toISOString(),
                      })
                      .where(eq(executionRecords.id, executionId));
                    return;
                  }
                  await app.db
                    .update(executionRecords)
                    .set({
                      status: "FAILED",
                      errorCode: "EXECUTION_FAILED",
                      completedAt: new Date().toISOString(),
                    })
                    .where(eq(executionRecords.id, executionId));
                  send(
                    FrameType.DATA,
                    frame.header.streamId,
                    {
                      eventType: "execution.failed",
                      executionId,
                      state: "FAILED",
                      data: {
                        code: "EXECUTION_FAILED",
                        message: "Execution failed",
                      },
                    },
                    frame.header.sequence,
                    Priority.HIGH,
                  );
                } finally {
                  executionControllers.delete(executionId);
                  inFlight.set(
                    frame.header.streamId,
                    Math.max(0, (inFlight.get(frame.header.streamId) || 1) - 1),
                  );
                }
              })();
              continue;
            }
            if (frame.header.frameType === FrameType.SIGNAL) {
              const signal = frame.payload as {
                signal?: string;
                executionId?: string;
              };
              if (signal.signal === "CANCEL" && signal.executionId) {
                const record = (
                  await app.db
                    .select()
                    .from(executionRecords)
                    .where(eq(executionRecords.id, signal.executionId))
                    .limit(1)
                )[0];
                const terminal =
                  record?.status === "SUCCEEDED" ||
                  record?.status === "FAILED" ||
                  record?.status === "CANCELLED";
                if (record && !terminal) {
                  cancelled.add(signal.executionId);
                  executionControllers.get(signal.executionId)?.abort();
                  const runId = executions.get(signal.executionId);
                  if (runId) ai.cancelRun(runId);
                  await app.db
                    .update(executionRecords)
                    .set({
                      status: "CANCELLED",
                      completedAt: new Date().toISOString(),
                    })
                    .where(eq(executionRecords.id, signal.executionId));
                }
                send(
                  FrameType.ACK,
                  frame.header.streamId,
                  {
                    streamId: frame.header.streamId,
                    ackSeq: frame.header.sequence,
                    executionId: signal.executionId,
                    state:
                      record && !terminal
                        ? "CANCELLED"
                        : record?.status || "FAILED",
                  },
                  frame.header.sequence,
                  Priority.CRITICAL,
                );
                continue;
              }
            }
            closeProtocol("UNSUPPORTED_FRAME");
          }
        } catch {
          socket.close(1002, "invalid AEP binary frame");
        }
      });
      socket.on("close", () => {
        subscriptionCleanups.forEach((cleanup) => cleanup());
        subscriptionCleanups.clear();
      });
    },
  );
}
