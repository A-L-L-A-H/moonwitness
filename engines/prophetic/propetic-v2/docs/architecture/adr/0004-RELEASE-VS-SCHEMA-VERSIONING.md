# ADR 0004 — Release Version vs Schema Version

**Status:** Accepted  
**Release:** v2.1.0  
**Data schema:** 2.0

A documentation/UI/repository release can advance without changing the persisted data schema. `v2.1.0` therefore keeps `schema_version: 2.0` because no breaking field contract was introduced.
