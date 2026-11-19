import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    midMounted?: boolean;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      username: string;
      email: string;
      role: "admin" | "editor" | "viewer";
      displayName: string;
      tenantId?: string;
    };
    tenantId?: string;
    traceparent?: string;
  }
}
