# RGBL Benchmarks

`fixtures/v0.8.json` contains the initial development fixture set for the RGBL R&D v0.8 model.

These fixtures are **development tests**, not evidence of scientific validation. They are intended to exercise boundary discipline, uncertainty handling, provenance, conflict preservation, and common overreach diagnostics.

The human-evaluation rubric is defined in `docs/rnd/BENCHMARK-PROTOCOL.md`. The engine exports `scoreBenchmark()` for aggregating nine rubric dimensions scored 0..4.
