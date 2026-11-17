# ADR-004: Fastify Addon Registration Pattern

## Context

The API needs to be extensible with modular features (timeline, auth, riot-ai, etc.) without tight coupling.

## Decision

Use an addon registration pattern:

- `AddonRegistry` manages addon lifecycle and dependency ordering
- Each addon exports: `manifest` (name, version, provides, depends) + `register(fastify)` function
- Addons registered in `bootstrap.ts` via `registry.add()` then `registry.load()`
- Addons are loaded in dependency order

## Consequences

- **Positive**: Modular, testable, clear dependency graph, easy to add new features
- **Negative**: Indirection; all addons must conform to manifest contract

## Example

```ts
registry.add({
  manifest: { name: "timeline", version: "0.1.0", depends: [], provides: { routes: ["timeline"] } },
  register: async () => {
    await registerTimelineAddon(fastify, opts);
  },
});
```
