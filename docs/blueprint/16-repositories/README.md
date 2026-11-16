# 16 — Repositories

Target repository topology:

```text
CORE
  moonwitness-core

KNOWLEDGE
  moonwitness-corpus

INTELLIGENCE
  moonwitness-cosmic

METHODOLOGY
  moonwitness-crayon

DOMAIN
  moonwitness-prophetic

RUNTIME
  moonwitness-runtime
  moonwitness-worker

NETWORK / SDK
  moonwitness-api
  moonwitness-sdk

FRONTEND PLATFORM
  moonwitness-frontend-platform

APPLICATIONS
  moonwitness-wheremythfadetolegend    ← PRIMARY PUBLIC WEB
  moonwitness-commandcenter             ← HOLD
  moonwitness-crayon-lab

LEGACY APPLICATION
  moonwitness-web                        ← PAUSED

ARCHITECTURE
  moonwitness-blueprint
```

The package is the reusable unit. Repositories are independent development boundaries. Git submodules are not a dependency mechanism.

The canonical public Web application is `moonwitness-wheremythfadetolegend`. It composes the reusable frontend platform, consumes live platform capabilities through `moonwitness-sdk` / MoonClient and `moonwitness-api`, and may retain versioned GitHub-backed historical observatory data through a static data adapter.

`moonwitness-web` remains a legacy public application and is paused; it is not the active public Web ownership target.
