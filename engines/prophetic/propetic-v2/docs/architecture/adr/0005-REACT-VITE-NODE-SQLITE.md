# ADR 0005 — React/Vite + Node + SQLite

**Status:** Accepted  
**Release:** 2.3.2 (decision introduced in 2.2.0)

## Decision

Use React + Vite + TypeScript + shadcn/ui + Tailwind for the frontend, a Node.js local API for application access, and SQLite for local persistence.

## Why

- componentized UI instead of monolithic DOM scripting;
- fast local development with Vite;
- shadcn/ui keeps components in-repository and auditable;
- Tailwind provides consistent design tokens;
- SQLite fits a local research application and removes unnecessary server-database operations;
- research schema remains independent from application infrastructure.

## Consequence

PostgreSQL artifacts from v2.0/v2.1 are historical only and are no longer the active v2.3 database contract.
