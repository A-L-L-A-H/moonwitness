import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPassword } from "./crypto";
import { createMidHandler } from "./app";
import type {
  AuditEventRecord,
  D1DatabaseLike,
  D1PreparedStatementLike,
  MidEnv,
  MidIdentityStore,
  UserRecord,
} from "./types";

function createInMemoryProtocolDb(): D1DatabaseLike {
  const keys = new Map<string, Record<string, unknown>>();
  const clients = new Map<string, Record<string, unknown>>();
  const codes = new Map<string, Record<string, unknown>>();
  const refresh = new Map<string, Record<string, unknown>>();

  function prepare(query: string): D1PreparedStatementLike {
    let args: unknown[] = [];
    const stmt: D1PreparedStatementLike = {
      bind(...values: unknown[]) {
        args = values;
        return stmt;
      },
      async all<TRow = Record<string, unknown>>() {
        const sql = query.replace(/\s+/g, " ").trim();
        if (sql.startsWith("PRAGMA table_info")) {
          return { results: [{ name: "resource" }] as TRow[] };
        }
        if (sql.includes("FROM mid_signing_keys")) {
          return {
            results: [...keys.values()] as TRow[],
          };
        }
        if (sql.includes("FROM mid_clients WHERE client_id = ?")) {
          const hit = clients.get(String(args[0]));
          return { results: (hit ? [hit] : []) as TRow[] };
        }
        if (sql.includes("FROM mid_auth_codes WHERE code_hash = ?")) {
          const hit = codes.get(String(args[0]));
          return { results: (hit ? [hit] : []) as TRow[] };
        }
        if (sql.includes("FROM mid_refresh_tokens WHERE token_hash = ?")) {
          const hit = refresh.get(String(args[0]));
          return { results: (hit ? [hit] : []) as TRow[] };
        }
        return { results: [] as TRow[] };
      },
      async run() {
        const sql = query.replace(/\s+/g, " ").trim();
        if (sql.startsWith("INSERT INTO mid_signing_keys")) {
          keys.set(String(args[0]), {
            kid: args[0],
            public_jwk_json: args[1],
            encrypted_private_jwk: args[2],
            active: 1,
            created_at: args[3],
          });
        } else if (sql.startsWith("INSERT OR IGNORE INTO mid_clients")) {
          const id = String(args[0]);
          if (!clients.has(id)) {
            clients.set(id, {
              client_id: id,
              name: args[1],
              redirect_uris_json: args[2],
              allowed_scopes_json: args[3],
              client_type: args[4],
              client_secret_hash: null,
              first_party: args[5],
              created_at: args[6],
            });
          }
        } else if (sql.startsWith("INSERT INTO mid_auth_codes")) {
          codes.set(String(args[0]), {
            code_hash: args[0],
            client_id: args[1],
            user_id: args[2],
            redirect_uri: args[3],
            scope: args[4],
            code_challenge: args[5],
            code_challenge_method: args[6],
            nonce: args[7],
            resource: args[8],
            expires_at: args[9],
            consumed_at: null,
            created_at: args[10],
          });
        } else if (sql.startsWith("UPDATE mid_auth_codes SET consumed_at = ?")) {
          const hit = codes.get(String(args[1]));
          if (hit && hit.consumed_at === null) {
            hit.consumed_at = args[0];
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        } else if (sql.startsWith("INSERT INTO mid_refresh_tokens")) {
          refresh.set(String(args[0]), {
            token_hash: args[0],
            family_id: args[1],
            client_id: args[2],
            user_id: args[3],
            scope: args[4],
            resource: args[5],
            expires_at: args[6],
            revoked_at: null,
            replaced_by: null,
            created_at: args[7],
          });
        }
        return { meta: { changes: 1 } };
      },
    };
    return stmt;
  }

  return {
    prepare,
    async batch(statements) {
      return Promise.all(statements.map((s) => s.run()));
    },
  };
}

describe("Pluggable MidIdentityStore with UUIDv7 string userId", () => {
  it("completes authorize -> token -> userinfo through custom MidIdentityStore without SQL users table", async () => {
    const uuidUserId = "01960f00-0000-7000-8000-000000000042";
    const passwordHash = await hashPassword("correct-horse-battery-staple");
    const user: UserRecord = {
      id: uuidUserId,
      username: "pilot",
      email: "pilot@moonwitness.biz.id",
      role: "admin",
      displayName: "Pilot UUID",
      passwordHash,
    };
    const sessions = new Map<string, string>();
    const audits: AuditEventRecord[] = [];

    const identityStore: MidIdentityStore = {
      async findUserByLogin(login) {
        return login === user.username || login === user.email ? user : null;
      },
      async findPublicUserById(id) {
        return String(id) === uuidUserId
          ? {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              displayName: user.displayName,
            }
          : null;
      },
      async updateUserPasswordHash(id, nextHash) {
        if (String(id) === uuidUserId) user.passwordHash = nextHash;
      },
      async createSsoSession(id) {
        const sid = `sid_${crypto.randomUUID()}`;
        sessions.set(sid, String(id));
        return sid;
      },
      async findActiveSsoSession(sid) {
        const uid = sessions.get(sid);
        if (!uid) return null;
        return {
          sessionId: sid,
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
          },
        };
      },
      async revokeSsoSession(sid) {
        sessions.delete(sid);
      },
      async recordAuditEvent(entry) {
        audits.push({
          id: crypto.randomUUID(),
          eventType: entry.eventType,
          actorUserId: entry.actorUserId,
          clientId: entry.clientId,
          detailJson: JSON.stringify(entry.detail),
          ipAddress: entry.ipAddress,
          createdAt: new Date().toISOString(),
        });
      },
      async listRecentAuditEvents() {
        return audits;
      },
    };

    const handler = createMidHandler();
    const env: MidEnv = {
      DB: createInMemoryProtocolDb(),
      IDENTITY_STORE: identityStore,
      MID_KEY_ENCRYPTION_SECRET: "unit-test-secret-0123456789abcdef",
      ISSUER_URL: "https://id.moonwitness.biz.id",
    };

    const verifier = "verifier_abcdefghijklmnopqrstuvwxyz_0123456789";
    const challenge = createHash("sha256").update(verifier).digest("base64url");

    const authorizeForm = new URLSearchParams({
      client_id: "moonwitness-web",
      redirect_uri: "https://moonwitness.biz.id/auth/callback",
      scope: "openid profile email",
      state: "st-1",
      code_challenge: challenge,
      code_challenge_method: "S256",
      identifier: "pilot",
      password: "correct-horse-battery-staple",
      decision: "approve",
    });

    const authRes = await handler(
      new Request("https://id.moonwitness.biz.id/authorize", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://id.moonwitness.biz.id",
        },
        body: authorizeForm.toString(),
      }),
      env,
    );
    expect(authRes.status).toBe(302);
    const code = new URL(authRes.headers.get("location")!).searchParams.get("code")!;

    const tokenRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: "https://moonwitness.biz.id/auth/callback",
          client_id: "moonwitness-web",
          code_verifier: verifier,
        }).toString(),
      }),
      env,
    );
    expect(tokenRes.status).toBe(200);
    const tokens = (await tokenRes.json()) as { access_token: string };

    const userInfoRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/userinfo", {
        headers: { authorization: `Bearer ${tokens.access_token}` },
      }),
      env,
    );
    expect(userInfoRes.status).toBe(200);
    const userInfo = (await userInfoRes.json()) as { sub: string; preferred_username: string };
    expect(userInfo.sub).toBe(uuidUserId);
    expect(userInfo.preferred_username).toBe("pilot");
    expect(
      audits.some((a) => a.eventType === "oauth.token.issued" && a.actorUserId === uuidUserId),
    ).toBe(true);
  });
});
