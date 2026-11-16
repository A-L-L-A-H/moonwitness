import { createClient, type Client } from '@libsql/client';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface StorageConfig {
  url?: string;
}

export class AiStorage {
  private client: Client;
  private initialized: boolean = false;

  constructor(config: StorageConfig = {}) {
    const dbPath = config.url || 'file:./data/ai.db';
    
    // Ensure parent directory exists if using local file
    if (dbPath.startsWith('file:')) {
      const filePath = dbPath.replace('file:', '');
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    this.client = createClient({ url: dbPath });
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS ai_threads (
        id TEXT PRIMARY KEY,
        title TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS ai_messages (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        name TEXT,
        tool_call_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (thread_id) REFERENCES ai_threads(id) ON DELETE CASCADE
      );
    `);

    // In-place compatibility migration preserves the legacy database file. SQLite
    // cannot rename tables conditionally, so only migrate when legacy tables exist.
    const legacy = await this.client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('mastra_threads', 'mastra_messages')");
    const names = new Set(legacy.rows.map(row => String(row.name)));
    if (names.has('mastra_threads')) await this.client.execute('INSERT OR IGNORE INTO ai_threads SELECT * FROM mastra_threads');
    if (names.has('mastra_messages')) await this.client.execute('INSERT OR IGNORE INTO ai_messages SELECT * FROM mastra_messages');

    this.initialized = true;
  }

  getClient(): Client {
    return this.client;
  }
}
