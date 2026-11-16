# Crayon operational data ownership

Crayon owns operational projects, tasks, cases, reviews, file metadata, notifications, and foreign-resource projections. Platform owns IAM; MFTL, Legend, Superhero, RGBL, AWS, JIZZ, and Correlation own their respective canonical research domains; Signal owns external signal lifecycle.

| Model | Owner |
| --- | --- |
| Task, Project, Case, Review | Crayon |
| Resource reference, annotation, notification | Crayon operational state |
| Story, Event, Person, Text, Law, Perspective | Their named research repository |
| Reviewed relationship | rocksoul-correlation |
| User/IAM | rocksoul-platform |

`REFERENCE ≠ OWNERSHIP`; `CACHE ≠ CANONICAL`; `DRAFT ≠ PUBLICATION`; `REVIEW ≠ EXECUTION`; `ANNOTATION ≠ COMMUNITY COMMENT`; `ACTIVITY ≠ ADMIN AUDIT`; and `NOTIFICATION ≠ SYSTEM LOG`.

`project_tasks` remains a compatibility table only. Startup and migration copy missing rows to the canonical `tasks` table idempotently, normalize status to `backlog`, `todo`, `in_progress`, `blocked`, `done`, or `cancelled`, and normalize priority to `low`, `medium`, `high`, or `critical`.

Only `resource_references`, `research_cases`, `review_items`, `research_work_items`, and private annotations are registered for controlled API use. Snapshot/sync state, publication payloads, decision history, activity data, recipient rows, and file storage keys remain internal. Review and case status changes use dedicated operational workflow endpoints; an approved review is required before a publication request can be created.

The in-process operational workflow regression is [tests/e2e/05-operational-orm.test.ts](/X:/REPO/2026/rocksoul/tests/e2e/05-operational-orm.test.ts); it covers authenticated authority, foreign-reference uniqueness, transitions, and the publication approval gate.
