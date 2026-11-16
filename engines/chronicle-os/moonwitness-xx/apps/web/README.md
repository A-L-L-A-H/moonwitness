# Web application

Reserved for the Next.js App Router frontend generated from the approved contract:

- [Frontend DNA](../../docs/design/FRONTEND_DNA.md)
- [Vercel v0 handoff](../../docs/design/V0_FRONTEND_HANDOFF.md)

The web app must call Fastify through the centralized contract/client boundary. It must never connect directly to PostgreSQL, Redis, MikroORM, BullMQ, or WhatsApp.
