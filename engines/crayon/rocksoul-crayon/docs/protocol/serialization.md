# Serialization Constitution & Evaluation
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. The Serialization Contract (`ISerializer`)

To decouple the binary frame transport from wire encoders, AEP mandates an abstract serializer interface:

```typescript
export interface ISerializer {
  readonly format: 'msgpack' | 'cbor' | 'json';
  readonly contentType: string;

  /**
   * Encodes an arbitrary JavaScript object or primitive into a binary Uint8Array.
   */
  encode<T = unknown>(data: T): Uint8Array;

  /**
   * Decodes a binary Uint8Array back into a strongly-typed structure.
   */
  decode<T = unknown>(buffer: Uint8Array): T;
}
```

---

## 2. Comparative Evaluation Matrix

AEP evaluated the three primary binary serialization candidates against ten rigorous engineering criteria:

| Evaluation Dimension | MessagePack (`@msgpack/msgpack`) | CBOR (`cbor-x`) | Protobuf (Protocol Buffers) | JSON (Development Baseline) |
|---|---|---|---|---|
| **1. Browser Runtime Compatibility** | ⭐⭐⭐⭐⭐ Zero-polyfill `Uint8Array`, tiny bundle (~8KB gzip). | ⭐⭐⭐⭐ Good, slightly larger bundle (~18KB gzip). | ⭐⭐⭐ Heavy runtime, requires dynamic reflection bundle. | ⭐⭐⭐⭐⭐ Native `JSON.parse` / `JSON.stringify`. |
| **2. Node.js Compatibility** | ⭐⭐⭐⭐⭐ Pure ESM, native Buffer & Uint8Array support. | ⭐⭐⭐⭐⭐ High-performance V8 native bindings available. | ⭐⭐⭐⭐ Good Node support via `protobufjs`. | ⭐⭐⭐⭐⭐ Native V8 core. |
| **3. Schema Evolution Agility** | ⭐⭐⭐⭐⭐ Dynamic key-value mappings adapt instantly to Drizzle models. | ⭐⭐⭐⭐⭐ Tagged extensible types. | ⭐⭐ Rigid field tag numbering; breaking schema changes on dynamic models. | ⭐⭐⭐⭐⭐ Full dynamic agility. |
| **4. TypeScript Integration** | ⭐⭐⭐⭐⭐ Full type safety via generic inference `decode<T>()`. | ⭐⭐⭐⭐ Good typing support. | ⭐⭐⭐ Requires `.proto` compilation build step. | ⭐⭐⭐⭐⭐ Seamless TypeScript interface casting. |
| **5. Wire Payload Efficiency** | ⭐⭐⭐⭐ 30% - 60% smaller than JSON; binary data unescaped. | ⭐⭐⭐⭐ Equivalent to MessagePack. | ⭐⭐⭐⭐⭐ Highest density (integer varints, field tags). | ⭐ Verbose strings, heavy key duplication. |
| **6. Encode/Decode Throughput** | ⭐⭐⭐⭐⭐ ~2.5x - 4x faster than JSON; zero string escaping. | ⭐⭐⭐⭐⭐ Very high throughput. | ⭐⭐⭐⭐⭐ Extremely fast for static schemas. | ⭐⭐⭐ Fast in V8, but string-bound. |
| **7. Binary & Media Streaming** | ⭐⭐⭐⭐⭐ Native binary byte arrays (no Base64 penalty). | ⭐⭐⭐⭐⭐ Native byte string support. | ⭐⭐⭐⭐ Native `bytes` field. | ⭐ Requires Base64 encoding (+33% size). |
| **8. Developer Debuggability** | ⭐⭐⭐⭐ Trivial one-line CLI conversion to JSON. | ⭐⭐⭐⭐ Standard RFC 7049 tooling. | ⭐⭐ Requires `.proto` definitions to inspect raw bytes. | ⭐⭐⭐⭐⭐ Human-readable text in DevTools. |
| **9. Ecosystem & Community** | ⭐⭐⭐⭐⭐ Millions of weekly downloads, battle-tested standard. | ⭐⭐⭐⭐ IETF RFC standard, solid community. | ⭐⭐⭐⭐⭐ Google enterprise standard. | ⭐⭐⭐⭐⭐ Universal web baseline. |
| **10. Implementation Friction** | ⭐⭐⭐⭐⭐ Zero build steps, drop-in isomorphic library. | ⭐⭐⭐⭐ Moderate setup. | ⭐ Extensive build toolchain and proto generation. | ⭐⭐⭐⭐⭐ Zero friction. |

---

## 3. Normative Decision: MessagePack

### 3.1 Primary Wire Format: MessagePack
- **Production Standard**: **MessagePack** is established as the authoritative production binary serializer for AEP.
- **Reference Implementation**: `@msgpack/msgpack` (pure TypeScript/JS, zero-dependency, isomorphic browser + Node.js).
- **Justification**:
  1. *Dynamic Capability Mapping*: Rocksoul relies on dynamic Drizzle ORM models and Rocksoul AI tool declarations that evolve at runtime. MessagePack supports dynamic schema maps without requiring ahead-of-time `.proto` compilation.
  2. *Zero Base64 Overhead*: Transmitting canvas snapshots, coding diffs, and binary files incurs 0% encoding inflation compared to JSON's 33% Base64 tax.
  3. *Client Size*: Minimal ~7.5 kB footprint preserves fast Initial Bundle loading on `apps/web`.

### 3.2 Role of JSON
- **JSON is strictly restricted to**:
  1. Local development debugging (via query param `?format=json` or `X-AEP-Format: json`).
  2. Wireframe protocol inspectors and test fixtures.
  3. Fallback compatibility when binary buffers are unsupported.
- **JSON MUST NOT be used as the default production wire serializer.**
