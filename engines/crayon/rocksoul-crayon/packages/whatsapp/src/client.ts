import EventEmitter from 'node:events';
import path from 'node:path';
import fs from 'node:fs';
import pino from 'pino';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
  type proto,
  type AnyMessageContent,
} from '@whiskeysockets/baileys';
import type {
  WhatsAppClientOptions,
  WhatsAppConnectionState,
  WhatsAppUser,
  WhatsAppIncomingMessage,
  WhatsAppContact,
  WhatsAppEventMap,
  WhatsAppStatusItem,
  WhatsAppProfileInfo,
} from './types.js';
import { formatToWhatsAppJid, extractPhoneNumber, isGroupJid, extractMessageText } from './utils.js';

export class WhatsAppClient extends EventEmitter {
  private socket: WASocket | null = null;
  private state: WhatsAppConnectionState = 'idle';
  private currentQR: string | null = null;
  private currentUser: WhatsAppUser | null = null;
  private readonly options: Required<Omit<WhatsAppClientOptions, 'browser'>> & {
    browser?: [string, string, string];
  };
  private isInitializing = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private contacts = new Map<string, WhatsAppContact>();
  private statusUpdates: WhatsAppStatusItem[] = [];


  constructor(options: WhatsAppClientOptions = {}) {
    super();
    this.options = {
      sessionDir: options.sessionDir ?? path.resolve(process.cwd(), 'data', 'whatsapp-session'),
      logLevel: options.logLevel ?? 'silent',
      printQRToTerminal: options.printQRToTerminal ?? false,
      markOnlineOnConnect: options.markOnlineOnConnect ?? true,
      browser: options.browser,
    };
  }

  // Typed EventEmitter helpers
  public override on<K extends keyof WhatsAppEventMap>(event: K, listener: WhatsAppEventMap[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  public override once<K extends keyof WhatsAppEventMap>(event: K, listener: WhatsAppEventMap[K]): this {
    return super.once(event, listener as (...args: unknown[]) => void);
  }

  public override emit<K extends keyof WhatsAppEventMap>(event: K, ...args: Parameters<WhatsAppEventMap[K]>): boolean {
    return super.emit(event, ...args);
  }

  public getStatus(): WhatsAppConnectionState {
    return this.state;
  }

  public getQR(): string | null {
    return this.currentQR;
  }

  public getUser(): WhatsAppUser | null {
    return this.currentUser;
  }

  public isConnected(): boolean {
    return this.state === 'open' && this.socket !== null;
  }

  /**
   * Initialize WhatsApp connection and load saved auth credentials.
   */
  public async initialize(): Promise<void> {
    if (this.isInitializing || this.state === 'open') {
      return;
    }

    this.isInitializing = true;
    this.state = 'connecting';
    this.emit('connecting');

    try {
      // Ensure session directory exists
      if (!fs.existsSync(this.options.sessionDir)) {
        fs.mkdirSync(this.options.sessionDir, { recursive: true });
      }

      const { state: authState, saveCreds } = await useMultiFileAuthState(this.options.sessionDir);
      const { version } = await fetchLatestBaileysVersion();

      const logger = pino({ level: this.options.logLevel });

      const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: this.options.printQRToTerminal,
        auth: authState,
        markOnlineOnConnect: this.options.markOnlineOnConnect,
        browser: this.options.browser ?? ['Rocksoul WhatsApp', 'Chrome', '1.0.0'],
      });

      this.socket = sock;

      // Listen for credentials update
      sock.ev.on('creds.update', saveCreds);

      // Listen for connection update
      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.currentQR = qr;
          this.state = 'qrcode';
          this.emit('qr', qr);
          this.emit('connection', { state: 'qrcode', qr });
        }

        if (connection === 'close') {
          this.state = 'close';
          this.currentQR = null;
          this.currentUser = null;

          const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          this.emit('disconnected', {
            loggedOut: isLoggedOut,
            statusCode,
            reason: lastDisconnect?.error?.message,
          });

          this.emit('connection', {
            state: 'close',
            error: lastDisconnect?.error as Error | undefined,
          });

          // Auto-reconnect if not intentionally logged out
          if (!isLoggedOut) {
            this.scheduleReconnect();
          }
        } else if (connection === 'open') {
          this.state = 'open';
          this.currentQR = null;

          const rawUser = sock.user;
          const phone = rawUser ? extractPhoneNumber(rawUser.id) : '';
          this.currentUser = rawUser
            ? {
                id: rawUser.id,
                name: rawUser.name,
                phone,
              }
            : null;

          if (this.currentUser) {
            this.emit('ready', this.currentUser);
            this.emit('connection', {
              state: 'open',
              user: this.currentUser,
            });
          }
        }
      });

      // Listen for incoming messages
      sock.ev.on('messages.upsert', (m) => {
        if (m.type !== 'notify') return;

        for (const raw of m.messages) {
          if (!raw.message) continue;

          const from = raw.key.remoteJid || '';

          // Handle WhatsApp Status/Story broadcast
          if (from === 'status@broadcast') {
            const senderJid = raw.key.participant || raw.participant || '';
            const senderNumber = extractPhoneNumber(senderJid);
            const text = extractMessageText(raw.message);
            const hasImage = Boolean(raw.message.imageMessage);
            const hasVideo = Boolean(raw.message.videoMessage);
            const caption = raw.message.imageMessage?.caption || raw.message.videoMessage?.caption || undefined;
            const mediaType = hasImage ? 'image' : hasVideo ? 'video' : 'text';

            // Extract thumbnail if available
            let thumbnail: string | undefined;
            const thumbBuf = raw.message.imageMessage?.jpegThumbnail || raw.message.videoMessage?.jpegThumbnail;
            if (thumbBuf && Buffer.isBuffer(thumbBuf)) {
              thumbnail = `data:image/jpeg;base64,${thumbBuf.toString('base64')}`;
            } else if (thumbBuf && thumbBuf instanceof Uint8Array) {
              thumbnail = `data:image/jpeg;base64,${Buffer.from(thumbBuf).toString('base64')}`;
            }

            const statusItem: WhatsAppStatusItem = {
              id: raw.key.id || String(Date.now()),
              senderJid,
              senderNumber,
              senderName: raw.pushName || undefined,
              fromMe: Boolean(raw.key.fromMe),
              timestamp: typeof raw.messageTimestamp === 'number' ? raw.messageTimestamp : Number(raw.messageTimestamp || 0),
              text: text || caption,
              mediaType,
              thumbnail,
              caption,
            };

            // Keep in memory (limit to latest 100 status items)
            this.statusUpdates.unshift(statusItem);
            if (this.statusUpdates.length > 100) {
              this.statusUpdates.pop();
            }

            this.emit('status_update', statusItem);
            continue;
          }

          const senderNumber = extractPhoneNumber(from);
          const isGroup = isGroupJid(from);
          const text = extractMessageText(raw.message);

          const message: WhatsAppIncomingMessage = {
            id: raw.key.id || '',
            from,
            senderNumber,
            senderName: raw.pushName || undefined,
            isGroup,
            fromMe: Boolean(raw.key.fromMe),
            timestamp: typeof raw.messageTimestamp === 'number' ? raw.messageTimestamp : Number(raw.messageTimestamp || 0),
            text,
            raw,
          };

          this.emit('message', message);
        }
      });

      // Listen for WhatsApp contacts sync
      sock.ev.on('contacts.upsert', (newContacts) => {
        const contactList: WhatsAppContact[] = [];
        for (const c of newContacts) {
          if (!c.id || c.id.endsWith('@status')) continue;
          const phone = extractPhoneNumber(c.id);
          if (!phone) continue;

          const item: WhatsAppContact = {
            phoneNumber: phone,
            id: c.id,
            name: c.name || undefined,
            notify: c.notify || undefined,
            verifiedName: c.verifiedName || undefined,
          };
          this.contacts.set(phone, item);
          contactList.push(item);
        }
        if (contactList.length > 0) {
          this.emit('contacts', contactList);
        }
      });

      // Listen for incoming Presence updates (typing/recording/online)
      sock.ev.on('presence.update', ({ id, presences }) => {
        if (!presences) return;
        for (const [participant, info] of Object.entries(presences)) {
          this.emit('presence', {
            jid: participant || id,
            presence: info.lastKnownPresence,
            lastSeen: info.lastSeen,
          });
        }
      });

      // Listen for initial chat history sync from WhatsApp Web
      sock.ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest }) => {
        if (contacts && contacts.length > 0) {
          const contactList: WhatsAppContact[] = [];
          for (const c of contacts) {
            if (!c.id || c.id.endsWith('@status')) continue;
            const phone = extractPhoneNumber(c.id);
            if (!phone) continue;

            const item: WhatsAppContact = {
              phoneNumber: phone,
              id: c.id,
              name: c.name || undefined,
              notify: c.notify || undefined,
              verifiedName: c.verifiedName || undefined,
            };
            this.contacts.set(phone, item);
            contactList.push(item);
          }
          this.emit('contacts', contactList);
        }
      });
    } catch (err) {
      this.state = 'close';
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      this.scheduleReconnect();
    } finally {
      this.isInitializing = false;
    }
  }

  private scheduleReconnect(delayMs = 5000): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      void this.initialize();
    }, delayMs);
  }

  /**
   * Send a simple text message with optional quote/reply.
   * @param to Phone number (e.g. 08123456789) or JID
   * @param text Text message to send
   * @param quotedMessage Optional quoted WebMessageInfo to reply to
   */
  public async sendMessage(
    to: string,
    text: string,
    quotedMessage?: proto.IWebMessageInfo
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    const jid = formatToWhatsAppJid(to);
    return await this.socket.sendMessage(jid, { text }, quotedMessage ? { quoted: quotedMessage } : undefined);
  }

  /**
   * Send an image with optional caption and quote.
   */
  public async sendImage(
    to: string,
    image: Buffer | string,
    caption?: string,
    quotedMessage?: proto.IWebMessageInfo
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    const jid = formatToWhatsAppJid(to);
    const content: AnyMessageContent = typeof image === 'string'
      ? { image: { url: image }, caption }
      : { image, caption };

    return await this.socket.sendMessage(jid, content, quotedMessage ? { quoted: quotedMessage } : undefined);
  }

  /**
   * Send a document file.
   */
  public async sendDocument(
    to: string,
    document: Buffer | string,
    fileName: string,
    mimetype?: string,
    caption?: string,
    quotedMessage?: proto.IWebMessageInfo
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    const jid = formatToWhatsAppJid(to);
    const resolvedMimetype = mimetype || 'application/octet-stream';
    const content: AnyMessageContent = typeof document === 'string'
      ? { document: { url: document }, fileName, mimetype: resolvedMimetype, caption }
      : { document, fileName, mimetype: resolvedMimetype, caption };

    return await this.socket.sendMessage(jid, content, quotedMessage ? { quoted: quotedMessage } : undefined);
  }

  /**
   * Send an emoji reaction to a message.
   */
  public async sendReaction(
    to: string,
    messageId: string,
    emoji: string,
    fromMe = false
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    const jid = formatToWhatsAppJid(to);
    return await this.socket.sendMessage(jid, {
      react: {
        text: emoji,
        key: {
          remoteJid: jid,
          id: messageId,
          fromMe,
        },
      },
    });
  }

  /**
   * Delete / revoke a message for everyone.
   */
  public async deleteMessageForEveryone(
    to: string,
    messageId: string,
    fromMe = true
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    const jid = formatToWhatsAppJid(to);
    return await this.socket.sendMessage(jid, {
      delete: {
        remoteJid: jid,
        id: messageId,
        fromMe,
      },
    });
  }

  /**
   * Send presence update (e.g. 'composing', 'recording', 'available', 'unavailable').
   */
  public async sendPresence(to: string, presence: 'composing' | 'recording' | 'paused' | 'available' | 'unavailable'): Promise<void> {
    if (!this.socket || this.state !== 'open') return;
    const jid = formatToWhatsAppJid(to);
    await this.socket.sendPresenceUpdate(presence, jid);
  }

  /**
   * Create a new WhatsApp group.
   */
  public async createGroup(subject: string, participants: string[]): Promise<any> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    const formatted = participants.map((p) => formatToWhatsAppJid(p));
    return await this.socket.groupCreate(subject, formatted);
  }

  /**
   * Send any raw Baileys message content.
   */
  public async sendRaw(to: string, content: AnyMessageContent): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    const jid = formatToWhatsAppJid(to);
    return await this.socket.sendMessage(jid, content);
  }

  /**
   * Return all known synced WhatsApp contacts.
   */
  public getContacts(): WhatsAppContact[] {
    return Array.from(this.contacts.values());
  }

  /**
   * Return recent cached WhatsApp Stories/Status updates.
   */
  public getStatusUpdates(): WhatsAppStatusItem[] {
    return [...this.statusUpdates];
  }

  /**
   * Broadcast a new WhatsApp Status (Story).
   * Supports text status or image status.
   */
  public async sendStatus(content: { text?: string; imageUrl?: string }): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    const statusJid = 'status@broadcast';
    let messageContent: AnyMessageContent;

    if (content.imageUrl) {
      messageContent = {
        image: { url: content.imageUrl },
        caption: content.text,
      };
    } else if (content.text) {
      messageContent = {
        text: content.text,
      };
    } else {
      throw new Error('Status requires text or imageUrl');
    }

    const sent = await this.socket.sendMessage(statusJid, messageContent);

    // Also register our own status in memory
    if (this.currentUser) {
      const ownStatus: WhatsAppStatusItem = {
        id: sent?.key?.id || String(Date.now()),
        senderJid: this.currentUser.id,
        senderNumber: this.currentUser.phone,
        senderName: this.currentUser.name || 'Saya',
        fromMe: true,
        timestamp: Math.floor(Date.now() / 1000),
        text: content.text,
        mediaType: content.imageUrl ? 'image' : 'text',
        mediaUrl: content.imageUrl,
        caption: content.text,
      };
      this.statusUpdates.unshift(ownStatus);
      this.emit('status_update', ownStatus);
    }

    return sent;
  }

  /**
   * Get own profile info including status/about text and profile picture URL.
   */
  public async getProfileInfo(): Promise<WhatsAppProfileInfo | null> {
    if (!this.socket || this.state !== 'open' || !this.currentUser) {
      return null;
    }

    let imgUrl: string | null = null;
    let statusText: string | undefined;

    try {
      imgUrl = (await this.socket.profilePictureUrl(this.currentUser.id, 'image')) || null;
    } catch {
      // Profile picture might not be set or not accessible
    }

    try {
      const result = await this.socket.fetchStatus(this.currentUser.id);
      if (result && Array.isArray(result) && result.length > 0) {
        const item = result[0] as unknown as { status?: string };
        statusText = item.status;
      }
    } catch {
      // Status might not be available
    }

    return {
      id: this.currentUser.id,
      phone: this.currentUser.phone,
      name: this.currentUser.name,
      statusText,
      imgUrl,
    };
  }

  /**
   * Update profile picture using an image Buffer or local file path or URL.
   */
  public async updateProfilePhoto(image: Buffer | string): Promise<void> {
    if (!this.socket || this.state !== 'open' || !this.currentUser) {
      throw new Error('WhatsApp client is not connected');
    }

    let content: { url: string } | Buffer;
    if (typeof image === 'string') {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        content = { url: image };
      } else {
        content = fs.readFileSync(image);
      }
    } else {
      content = image;
    }

    await this.socket.updateProfilePicture(this.currentUser.id, content as unknown as import('@whiskeysockets/baileys').WAMediaUpload);
  }

  /**
   * Update own status (about text).
   */
  public async updateProfileStatus(status: string): Promise<void> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    await this.socket.updateProfileStatus(status);
  }

  /**
   * Update own display name.
   */
  public async updateProfileName(name: string): Promise<void> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }

    await this.socket.updateProfileName(name);
    if (this.currentUser) {
      this.currentUser.name = name;
    }
  }

  /**
   * Send a Poll / Vote message to a chat or group.
   */
  public async sendPoll(
    jid: string,
    name: string,
    values: string[],
    selectableCount = 1
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    const targetJid = formatToWhatsAppJid(jid);
    return await this.socket.sendMessage(targetJid, {
      poll: {
        name,
        values,
        selectableCount,
      },
    });
  }

  /**
   * Send a Location message.
   */
  public async sendLocation(
    jid: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    const targetJid = formatToWhatsAppJid(jid);
    return await this.socket.sendMessage(targetJid, {
      location: {
        degreesLatitude: latitude,
        degreesLongitude: longitude,
        name,
        address,
      },
    });
  }

  /**
   * Send a Contact Card (vCard).
   */
  public async sendContact(
    jid: string,
    displayName: string,
    phoneNumber: string
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    const targetJid = formatToWhatsAppJid(jid);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${displayName}\n` +
      `TEL;type=CELL;type=VOICE;waid=${cleanPhone}:+${cleanPhone}\n` +
      'END:VCARD';

    return await this.socket.sendMessage(targetJid, {
      contacts: {
        displayName,
        contacts: [{ vcard }],
      },
    });
  }

  /**
   * Forward an existing message to another chat.
   */
  public async forwardMessage(
    jid: string,
    message: proto.IWebMessageInfo
  ): Promise<proto.WebMessageInfo | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    const targetJid = formatToWhatsAppJid(jid);
    return await this.socket.sendMessage(targetJid, { forward: message });
  }

  /**
   * Mark messages as read (sync blue double check).
   */
  public async readMessages(keys: proto.IMessageKey[]): Promise<void> {
    if (!this.socket || this.state !== 'open') return;
    await this.socket.readMessages(keys);
  }

  /**
   * Fetch full group metadata (participants, admin roles, settings).
   */
  public async getGroupMetadata(jid: string): Promise<any> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    return await this.socket.groupMetadata(jid);
  }

  /**
   * Update group subject (title).
   */
  public async updateGroupSubject(jid: string, subject: string): Promise<void> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    await this.socket.groupUpdateSubject(jid, subject);
  }

  /**
   * Update group description.
   */
  public async updateGroupDescription(jid: string, description: string): Promise<void> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    await this.socket.groupUpdateDescription(jid, description);
  }

  /**
   * Update group profile picture.
   */
  public async updateGroupPicture(jid: string, image: Buffer | string): Promise<void> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    let content: { url: string } | Buffer;
    if (typeof image === 'string') {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        content = { url: image };
      } else {
        content = fs.readFileSync(image);
      }
    } else {
      content = image;
    }
    await this.socket.updateProfilePicture(jid, content as any);
  }

  /**
   * Update participants in a group (add, remove, promote, demote).
   */
  public async updateGroupParticipants(
    jid: string,
    participants: string[],
    action: 'add' | 'remove' | 'promote' | 'demote'
  ): Promise<any> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    const formattedParticipants = participants.map((p) => formatToWhatsAppJid(p));
    return await this.socket.groupParticipantsUpdate(jid, formattedParticipants, action);
  }

  /**
   * Get invite code for group.
   */
  public async getGroupInviteCode(jid: string): Promise<string | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    return await this.socket.groupInviteCode(jid);
  }

  /**
   * Revoke invite code for group.
   */
  public async revokeGroupInviteCode(jid: string): Promise<string | undefined> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    return await this.socket.groupRevokeInvite(jid);
  }

  /**
   * Update group setting (announcement / locked).
   */
  public async updateGroupSetting(
    jid: string,
    setting: 'announcement' | 'not_announcement' | 'locked' | 'unlocked'
  ): Promise<void> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    await this.socket.groupSettingUpdate(jid, setting);
  }

  /**
   * Leave a group.
   */
  public async leaveGroup(jid: string): Promise<void> {
    if (!this.socket || this.state !== 'open') {
      throw new Error('WhatsApp client is not connected');
    }
    await this.socket.groupLeave(jid);
  }


  /**
   * Gracefully close the socket connection without deleting auth credentials.
   */
  public async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.end(new Error('Manual disconnect'));
      this.socket = null;
    }

    this.state = 'close';
    this.currentQR = null;
    this.currentUser = null;
  }

  /**
   * Logout and delete local auth session directory.
   */
  public async logout(): Promise<void> {
    if (this.socket) {
      try {
        await this.socket.logout();
      } catch {
        // Ignore logout errors if socket is already closed
      }
      this.socket = null;
    }

    await this.disconnect();

    // Clean session files
    if (fs.existsSync(this.options.sessionDir)) {
      fs.rmSync(this.options.sessionDir, { recursive: true, force: true });
    }
  }
}
