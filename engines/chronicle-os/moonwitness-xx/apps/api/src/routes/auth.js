import {
  AuthSessionSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  successEnvelope
} from "@moonwitness/contracts";
import { AuthServiceError } from "@moonwitness/auth";

function requireAuth(request) {
  if (!request.authUser || !request.authSession) {
    throw new AuthServiceError("UNAUTHENTICATED", "Authentication is required.", 401);
  }

  return { user: request.authUser, session: request.authSession };
}

function setSessionCookie(reply, cookie, sessionToken) {
  reply.setCookie(cookie.name, sessionToken, cookie.options);
}

export async function authRoutes(app) {
  app.post("/register", {
    schema: { body: RegisterRequestSchema },
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } }
  }, async (request, reply) => {
    if (!request.em) {
      throw new AuthServiceError("AUTH_UNAVAILABLE", "Authentication storage is unavailable.", 503);
    }

    const user = await app.authService.register(request.em, request.body);
    const session = await app.authService.createSession(request.em, user);
    setSessionCookie(reply, app.authCookie, session.sessionToken);

    return reply.code(201).send(successEnvelope({
      user: app.authService.publicUser(user),
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt.toISOString()
    }));
  });

  app.post("/login", {
    schema: { body: LoginRequestSchema },
    config: { rateLimit: { max: 8, timeWindow: "15 minutes" } }
  }, async (request, reply) => {
    if (!request.em) {
      throw new AuthServiceError("AUTH_UNAVAILABLE", "Authentication storage is unavailable.", 503);
    }

    const user = await app.authService.authenticate(
      request.em,
      request.body.email,
      request.body.password
    );
    const session = await app.authService.createSession(request.em, user);
    setSessionCookie(reply, app.authCookie, session.sessionToken);

    return successEnvelope({
      user: app.authService.publicUser(user),
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt.toISOString()
    });
  });

  app.get("/me", async (request) => {
    const { user } = requireAuth(request);
    return successEnvelope({ user: app.authService.publicUser(user) });
  });

  app.get("/csrf", async (request) => {
    const { session } = requireAuth(request);
    const csrfToken = await app.authService.rotateCsrfToken(request.em, session);
    return successEnvelope({ csrfToken });
  });

  app.post("/logout", async (request, reply) => {
    if (request.authSession && request.em) {
      await app.authService.revokeSession(request.em, request.authSession);
    }

    reply.clearCookie(app.authCookie.name, {
      path: "/",
      secure: app.authCookie.secure,
      sameSite: "lax"
    });

    return successEnvelope({ loggedOut: true });
  });
}
