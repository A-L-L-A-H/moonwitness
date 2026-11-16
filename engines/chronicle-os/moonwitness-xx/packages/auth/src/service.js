import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { User, UserSession } from "@moonwitness/database";
import { hashPassword, verifyPassword } from "./password.js";
import { createAuthorizationService } from "./authorization.js";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthServiceError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function hashToken(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizeEmail(email) {
  if (typeof email !== "string") {
    throw new AuthServiceError("INVALID_EMAIL", "A valid email address is required.");
  }

  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    throw new AuthServiceError("INVALID_EMAIL", "A valid email address is required.");
  }

  return normalized;
}

function normalizeHandle(handle) {
  if (typeof handle !== "string") {
    throw new AuthServiceError("INVALID_HANDLE", "A valid handle is required.");
  }

  const normalized = handle.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,47}$/.test(normalized)) {
    throw new AuthServiceError(
      "INVALID_HANDLE",
      "Handle must be 3–48 characters and contain only letters, numbers, underscores, or hyphens."
    );
  }

  return normalized;
}

function publicUser(user) {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    email: user.email,
    status: user.status
  };
}

function constantTimeHashMatch(expectedHex, actualHex) {
  if (typeof expectedHex !== "string" || typeof actualHex !== "string") return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");
  if (expected.length !== 32 || actual.length !== 32) return false;
  return timingSafeEqual(expected, actual);
}

export function createAuthService({ sessionTtlSeconds = SESSION_TTL_SECONDS } = {}) {
  const authorization = createAuthorizationService();
  async function register(em, input) {
    const email = normalizeEmail(input.email);
    const handle = normalizeHandle(input.handle);

    if (typeof input.displayName !== "string" ||
        input.displayName.trim().length < 2 ||
        input.displayName.trim().length > 120) {
      throw new AuthServiceError("INVALID_DISPLAY_NAME", "Display name must contain 2–120 characters.");
    }

    const passwordHash = await hashPassword(input.password);

    try {
      return await em.transactional(async (tx) => {
        const user = tx.create(User, {
          handle,
          email,
          displayName: input.displayName.trim(),
          passwordHash,
          status: "active"
        });
        await tx.persist(user).flush();
        await authorization.assignInitialRole(tx, user, "contributor");
        return user;
      });
    } catch (error) {
      if (error?.code === "23505" || error?.name === "UniqueConstraintViolationException") {
        throw new AuthServiceError(
          "IDENTITY_UNAVAILABLE",
          "This account identity cannot be used.",
          409
        );
      }
      throw error;
    }
  }

  async function authenticate(em, emailInput, password) {
    const email = normalizeEmail(emailInput);
    const user = await em.findOne(User, { email });

    if (!user || user.status !== "active") {
      if (typeof password === "string" && password.length <= 128) {
        await hashPassword(password).catch(() => {});
      }
      throw new AuthServiceError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new AuthServiceError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    }

    return user;
  }

  async function createSession(em, user) {
    const sessionToken = randomBytes(32).toString("base64url");
    const csrfToken = randomBytes(32).toString("base64url");
    const now = new Date();

    const session = em.create(UserSession, {
      user,
      tokenHash: hashToken(sessionToken),
      csrfTokenHash: hashToken(csrfToken),
      expiresAt: new Date(now.getTime() + sessionTtlSeconds * 1000),
      createdAt: now
    });

    await em.persist(session).flush();

    return {
      sessionToken,
      csrfToken,
      expiresAt: session.expiresAt
    };
  }

  async function resolveSession(em, sessionToken) {
    if (!em || typeof sessionToken !== "string" || sessionToken.length < 32 || sessionToken.length > 128) {
      return null;
    }

    const session = await em.findOne(
      UserSession,
      {
        tokenHash: hashToken(sessionToken),
        revokedAt: null,
        expiresAt: { $gt: new Date() }
      },
      { populate: ["user"] }
    );

    if (!session || session.user.status !== "active") return null;

    return { session, user: session.user };
  }

  async function rotateCsrfToken(em, session) {
    const csrfToken = randomBytes(32).toString("base64url");
    session.csrfTokenHash = hashToken(csrfToken);
    await em.flush();
    return csrfToken;
  }

  function verifyCsrfToken(session, token) {
    if (!session || typeof token !== "string" || token.length < 32 || token.length > 128) {
      return false;
    }

    return constantTimeHashMatch(session.csrfTokenHash, hashToken(token));
  }

  async function revokeSession(em, session) {
    if (!session || session.revokedAt) return;
    session.revokedAt = new Date();
    await em.flush();
  }

  return Object.freeze({
    register,
    authenticate,
    createSession,
    resolveSession,
    rotateCsrfToken,
    verifyCsrfToken,
    revokeSession,
    publicUser,
    authorization
  });
}
