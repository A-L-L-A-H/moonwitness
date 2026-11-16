# Protocol Versioning & Evolution Specification
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. Versioning Hierarchy

AEP enforces a multi-tier versioning hierarchy to allow independent protocol evolution, capability iteration, and zero-downtime rolling deployments:

```text
Protocol Major (Frame Header Byte 4)
  └── Wire format, header structure, canonical primitives.
Protocol Minor (Negotiated in HELLO payload)
  └── Optional feature flags, compression formats, heartbeat parameters.
Capability Version (Semver in CapabilityDefinition)
  └── Domain-specific capabilities (e.g. "task.assign" v1.2.0).
Schema Version (Model & Resource Registry)
  └── Drizzle table schema / Zod field contracts.
```

---

## 2. Normative Compatibility Rules

1. **Unknown Optional Fields**: Parsers **MUST** ignore unrecognized optional fields in payloads without throwing errors or discarding valid siblings.
2. **Unknown Optional Events**: Event listeners **MUST** safely disregard unhandled `eventType` strings without terminating the stream.
3. **Unknown Frame Flags**: Reserved flag bits that are set **MUST** be ignored safely unless defined as critical in a negotiated minor version.
4. **Unsupported Required Features**: If a client requests a mandatory feature flag during `HELLO` that the server does not support, the server **MUST** return an explicit `PROTOCOL_VERSION_UNSUPPORTED` error and close the transport cleanly.
5. **Incompatible Major Version**: If the header byte `protocolVersion` does not match the server's supported major version (`1`), the server drops the connection immediately to prevent frame corruption.

---

## 3. Rolling Deployment & Capability Overlap

During rolling production deployments:
- The Gateway advertises its capability catalog dynamically through the server `HELLO(helloKind: "WELCOME")` response and `modelRegistry.list()`.
- Clients resolve capabilities using semver compatibility: a client requesting `task.assign` `^1.0.0` will seamlessly match with a node providing `1.2.0`.
- Deprecated capabilities remain available for at least one release cycle before removal, emitting a `CAPABILITY_DEPRECATED` warning event.
