# CRAYON Deployment Target

Active target: **Vercel**

Retired target: Cloudflare Pages (never established as canonical live deployment).

Rules:

- public deployment source: `main` only;
- `dev` never creates preview/public deployments;
- deployed payload is `dist-lab/` only;
- live build must identify exact Git source SHA;
- deployment evidence is operational evidence, never semantic truth;
- a host migration must update this file, `vercel.json`/replacement config, production-readiness docs, and tracked deployment issue together.
