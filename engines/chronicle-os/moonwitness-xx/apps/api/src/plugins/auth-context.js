import { AuthServiceError } from "@moonwitness/auth";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function installAuthContext(app, {
  authService,
  cookieName,
  secureCookie = false,
  allowedOrigins = []
}) {
  app.decorateRequest("authUser", null);
  app.decorateRequest("authSession", null);

  app.addHook("onRequest", async (request) => {
    const token = request.cookies?.[cookieName];
    if (!token || !request.em) return;

    const resolved = await authService.resolveSession(request.em, token);
    if (!resolved) return;

    request.authUser = resolved.user;
    request.authSession = resolved.session;
  });

  app.addHook("preHandler", async (request) => {
    if (!UNSAFE_METHODS.has(request.method) || !request.authSession) return;

    const fetchSite = request.headers["sec-fetch-site"];
    if (fetchSite === "cross-site") {
      throw new AuthServiceError("CSRF_REJECTED", "Cross-site state changes are not allowed.", 403);
    }

    const origin = request.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      throw new AuthServiceError("ORIGIN_REJECTED", "Request origin is not allowed.", 403);
    }

    const csrfToken = request.headers["x-csrf-token"];
    if (!authService.verifyCsrfToken(request.authSession, csrfToken)) {
      throw new AuthServiceError("CSRF_REJECTED", "A valid CSRF token is required.", 403);
    }
  });

  app.decorate("authCookie", Object.freeze({
    name: cookieName,
    secure: secureCookie,
    options: Object.freeze({
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    })
  }));
}
