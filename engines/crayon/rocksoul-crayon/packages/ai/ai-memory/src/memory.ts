import { randomUUID } from 'node:crypto';
import type { IMemoryProvider, ModelMessage } from '@rocksoul/ai-core';
import type { AiStorage } from './storage.js';

export class MemoryService implements IMemoryProvider {
  constructor(private storage: AiStorage) {}

  async createThread(metadata?: Record<string, unknown>): Promise<string> {
    await this.storage.init();
    const threadId = randomUUID();
    const now = new Date().toISOString();
    const metadataStr = metadata ? JSON.stringify(metadata) : '{}';

    await this.storage.getClient().execute({
      sql: `INSERT INTO ai_threads (id, metadata, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      args: [threadId, metadataStr, now, now],
    });

    return threadId;
  }

  async getMessages(threadId: string): Promise<ModelMessage[]> {
    await this.storage.init();
    const result = await this.storage.getClient().execute({
      sql: `SELECT id, role, content, name, tool_call_id, created_at FROM ai_messages WHERE thread_id = ? ORDER BY created_at ASC`,
      args: [threadId],
    });

    return result.rows.map((row) => ({
      id: String(row.id),
      role: row.role as any,
      content: String(row.content),
      name: row.name ? String(row.name) : undefined,
      toolCallId: row.tool_call_id ? String(row.tool_call_id) : undefined,
      createdAt: String(row.created_at),
    }));
  }

  async getThread(threadId: string): Promise<{ id: string; metadata: Record<string, unknown>; createdAt: string; updatedAt: string } | undefined> {
    await this.storage.init();
    const result = await this.storage.getClient().execute({ sql: 'SELECT id, metadata, created_at, updated_at FROM ai_threads WHERE id = ?', args: [threadId] });
    const row = result.rows[0];
    if (!row) return undefined;
    let metadata: Record<string, unknown> = {};
    try { metadata = JSON.parse(String(row.metadata || '{}')) as Record<string, unknown>; } catch { /* malformed metadata remains empty */ }
    return { id: String(row.id), metadata, createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
  }

  async listThreads(ownerUserId: string): Promise<Array<{ id: string; metadata: Record<string, unknown>; createdAt: string; updatedAt: string }>> {
    await this.storage.init();
    const result = await this.storage.getClient().execute({ sql: "SELECT id, metadata, created_at, updated_at FROM ai_threads WHERE json_extract(metadata, '$.ownerUserId') = ? ORDER BY updated_at DESC", args: [ownerUserId] });
    return result.rows.map((row) => { let metadata: Record<string, unknown> = {}; try { metadata = JSON.parse(String(row.metadata || '{}')) as Record<string, unknown>; } catch { /* ignore */ } return { id: String(row.id), metadata, createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; });
  }

  async saveMessages(threadId: string, messages: ModelMessage[]): Promise<void> {
    await this.storage.init();
    const now = new Date().toISOString();

    for (const msg of messages) {
      const msgId = msg.id || randomUUID();
      await this.storage.getClient().execute({
        sql: `INSERT INTO ai_messages (id, thread_id, role, content, name, tool_call_id, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          msgId,
          threadId,
          msg.role,
          msg.content,
          msg.name ?? null,
          msg.toolCallId ?? null,
          msg.createdAt || now,
        ],
      });
    }

    await this.storage.getClient().execute({
      sql: `UPDATE ai_threads SET updated_at = ? WHERE id = ?`,
      args: [now, threadId],
    });
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.storage.init();
    await this.storage.getClient().execute({
      sql: `DELETE FROM ai_messages WHERE thread_id = ?`,
      args: [threadId],
    });
    await this.storage.getClient().execute({
      sql: `DELETE FROM ai_threads WHERE id = ?`,
      args: [threadId],
    });
  }
}
