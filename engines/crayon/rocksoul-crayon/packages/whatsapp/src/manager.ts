import path from 'node:path';
import fs from 'node:fs';
import EventEmitter from 'node:events';
import { WhatsAppClient } from './client.js';
import type {
  WhatsAppClientOptions,
  WhatsAppConnectionState,
  WhatsAppUser,
  WhatsAppIncomingMessage,
} from './types.js';

export interface SessionInfo {
  sessionId: string;
  status: WhatsAppConnectionState;
  user: WhatsAppUser | null;
  hasQR: boolean;
}

export interface SessionManagerOptions {
  /** Base root directory where sessions will be stored in subfolders */
  baseSessionsDir?: string;
  /** Global default options applied to created sessions */
  defaultClientOptions?: Partial<WhatsAppClientOptions>;
}

export class WhatsAppSessionManager extends EventEmitter {
  private readonly sessions = new Map<string, WhatsAppClient>();
  private readonly baseSessionsDir: string;
  private readonly defaultClientOptions: Partial<WhatsAppClientOptions>;

  constructor(options: SessionManagerOptions = {}) {
    super();
    this.baseSessionsDir = options.baseSessionsDir ?? process.env.WA_SESSIONS_DIR ?? path.resolve(process.cwd(), 'data', 'whatsapp-sessions');
    this.defaultClientOptions = options.defaultClientOptions ?? {};
  }

  public hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  public getSession(sessionId: string): WhatsAppClient | undefined {
    return this.sessions.get(sessionId);
  }

  public listSessions(): SessionInfo[] {
    // Also discover any session folder saved on disk
    if (fs.existsSync(this.baseSessionsDir)) {
      try {
        const dirs = fs.readdirSync(this.baseSessionsDir);
        for (const dir of dirs) {
          const credsPath = path.join(this.baseSessionsDir, dir, 'creds.json');
          if (fs.existsSync(credsPath) && !this.sessions.has(dir)) {
            void this.getOrCreateSession(dir).then((client) => {
              if (client.getStatus() === 'idle') {
                void client.initialize();
              }
            });
          }
        }
      } catch {
        // ignore
      }
    }

    const list: SessionInfo[] = [];
    for (const [sessionId, client] of this.sessions.entries()) {
      list.push({
        sessionId,
        status: client.getStatus(),
        user: client.getUser(),
        hasQR: Boolean(client.getQR()),
      });
    }
    return list;
  }

  /**
   * Auto-restore and start all existing saved sessions on disk
   */
  public async restoreSavedSessions(): Promise<string[]> {
    const restored: string[] = [];
    if (!fs.existsSync(this.baseSessionsDir)) return restored;

    try {
      const dirs = fs.readdirSync(this.baseSessionsDir);
      for (const dir of dirs) {
        const credsPath = path.join(this.baseSessionsDir, dir, 'creds.json');
        if (fs.existsSync(credsPath)) {
          const client = await this.getOrCreateSession(dir);
          if (client.getStatus() === 'idle') {
            void client.initialize();
          }
          restored.push(dir);
        }
      }
    } catch (err) {
      console.error('Failed to restore saved sessions:', err);
    }
    return restored;
  }

  /**
   * Get an existing session or instantiate a new one.
   */
  public async getOrCreateSession(
    sessionId: string,
    options?: Partial<WhatsAppClientOptions>
  ): Promise<WhatsAppClient> {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      return existing;
    }

    const sessionDir = path.join(this.baseSessionsDir, sessionId);

    const client = new WhatsAppClient({
      ...this.defaultClientOptions,
      ...options,
      sessionDir,
    });

    // Forward events
    client.on('message', (msg: WhatsAppIncomingMessage) => {
      this.emit('message', { sessionId, message: msg });
    });

    client.on('qr', (qr: string) => {
      this.emit('qr', { sessionId, qr });
    });

    client.on('ready', (user: WhatsAppUser) => {
      this.emit('ready', { sessionId, user });
    });

    client.on('connection', (update) => {
      this.emit('connection', { sessionId, update });
    });

    client.on('disconnected', (payload) => {
      this.emit('disconnected', { sessionId, payload });
    });

    client.on('contacts', (contacts) => {
      this.emit('contacts', { sessionId, contacts });
    });

    client.on('status_update', (status) => {
      this.emit('status_update', { sessionId, status });
    });

    client.on('presence', (payload) => {
      this.emit('presence', { sessionId, payload });
    });

    this.sessions.set(sessionId, client);
    return client;
  }

  /**
   * Disconnect an active session without wiping auth credentials.
   */
  public async disconnectSession(sessionId: string): Promise<boolean> {
    const client = this.sessions.get(sessionId);
    if (!client) return false;

    await client.disconnect();
    return true;
  }

  /**
   * Logout from WhatsApp and wipe session files.
   */
  public async logoutSession(sessionId: string): Promise<boolean> {
    const client = this.sessions.get(sessionId);
    if (!client) return false;

    await client.logout();
    this.sessions.delete(sessionId);
    return true;
  }

  /**
   * Delete session instance and files completely.
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    await this.logoutSession(sessionId);
    const sessionDir = path.join(this.baseSessionsDir, sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    return true;
  }

  /**
   * Gracefully disconnect all managed sessions.
   */
  public async disconnectAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const client of this.sessions.values()) {
      promises.push(client.disconnect());
    }
    await Promise.all(promises);
    this.sessions.clear();
  }
}
