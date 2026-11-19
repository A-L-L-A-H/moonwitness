# Timeline dataset

`src/seed.ts` is the canonical source for the five stable-ID timeline and era demo fixtures. Every seeded record is fictional, belongs to the MoonWitness story world, and is not a real-world event or verified operational activity. The `sources` and `notes` values are illustrative fixture metadata, not evidence counts.

The public Dock reads persisted records from the timeline API. The fixture set is not copied into the browser bundle. Runtime-created records remain in the database; rerunning the seed uses `INSERT OR IGNORE`, so it neither duplicates records nor replaces changes made to existing IDs.

Initialize and seed a local database explicitly with `pnpm --filter @moonwitness/api seed:demo`. Set `DATABASE_URL` to select the target database. Production seeding is refused unless `ALLOW_DEMO_SEED=1` is deliberately set. API startup does not seed by default; `SEED=1` opts in to loading the fixtures, subject to the same production guard.
