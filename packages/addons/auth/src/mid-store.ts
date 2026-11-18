import type { MidIdentityStore, PublicUser, UserRecord } from "@moonwitness/mid";
import { listAuditLogs, tryRecordAuditLog } from "@moonwitness/addon-audit";
import {
  createSession,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  getSessionWithUser,
  revokeSession,
  updateUserPasswordHash,
} from "./service.js";

/**
 * Single-source-of-truth identity store adapter plugged into `@moonwitness/mid`.
 * Eliminates legacy SQL `users`/`sessions`/`mid_audit_logs` duplication.
 */
export function createAuthMidIdentityStore(): MidIdentityStore {
  return {
    async findUserByLogin(login: string): Promise<UserRecord | null> {
      const normalized = login.trim();
      if (!normalized) return null;
      const found = (await findUserByUsername(normalized)) ?? (await findUserByEmail(normalized));
      if (!found || !found.isActive) return null;
      return {
        id: found.id,
        username: found.username,
        email: found.email,
        role: found.role,
        displayName: found.displayName,
        passwordHash: found.passwordHash,
      };
    },

    async findPublicUserById(userId): Promise<PublicUser | null> {
      const found = await findUserById(userId);
      if (!found || !found.isActive) return null;
      return {
        id: found.id,
        username: found.username,
        email: found.email,
        role: found.role,
        displayName: found.displayName,
      };
    },

    async updateUserPasswordHash(userId, newHash: string): Promise<void> {
      await updateUserPasswordHash(userId, newHash);
    },

    async createSsoSession(userId, ttlSeconds: number): Promise<string> {
      return createSession(userId, ttlSeconds * 1000);
    },

    async findActiveSsoSession(sessionId: string) {
      const hit = await getSessionWithUser(sessionId);
      if (!hit) return null;
      return {
        sessionId: hit.session.id,
        expiresAt: hit.session.expiresAt.toISOString(),
        user: {
          id: hit.userId,
          username: hit.username,
          email: hit.email,
          role: hit.role,
          displayName: hit.displayName,
        },
      };
    },

    async revokeSsoSession(sessionId: string): Promise<void> {
      await revokeSession(sessionId);
    },

    async recordAuditEvent(entry): Promise<void> {
      await tryRecordAuditLog({
        domain: "mid",
        entity: "oidc",
        entityId: entry.clientId ?? "sso",
        action: entry.eventType.includes("failed") ? "ACCESS" : "EXECUTE",
        actor: entry.actorUserId ? { actorId: String(entry.actorUserId) } : null,
        outcome: entry.eventType.includes("failed") ? "denied" : "success",
        metadata: {
          eventType: entry.eventType,
          ipAddress: entry.ipAddress,
          ...entry.detail,
        },
      });
    },

    async listRecentAuditEvents(limit = 40) {
      const logs = await listAuditLogs({ domain: "mid", limit });
      return logs.map((row) => {
        let meta: Record<string, unknown> = {};
        try {
          if (row.metadataJson) meta = JSON.parse(row.metadataJson) as Record<string, unknown>;
        } catch {
          meta = {};
        }
        return {
          id: row.id,
          eventType: typeof meta.eventType === "string" ? meta.eventType : row.action,
          actorUserId: row.actorId,
          clientId: row.entityId,
          detailJson: row.metadataJson ?? "{}",
          ipAddress: typeof meta.ipAddress === "string" ? meta.ipAddress : "",
          createdAt: row.occurredAt,
        };
      });
    },
  };
}
