# Schema evolution

Semantic payloads carry a schema identity and version. Compatible minor
changes may add optional fields; older clients ignore unknown optional fields.
Unknown required semantics and incompatible major versions fail closed.

Capability discovery must expose the supported schema range without leaking
privileged implementation details. Resource additions should remain tolerant,
while a removed or newly required field requires an explicit compatibility
decision and migration documentation.
