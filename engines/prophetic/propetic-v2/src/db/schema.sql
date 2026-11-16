CREATE TABLE IF NOT EXISTS corpus_source(
  id text PRIMARY KEY,
  book text NOT NULL,
  priority integer NOT NULL,
  role text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS source_edition(
  edition_id text PRIMARY KEY,
  source_id text NOT NULL REFERENCES corpus_source(id),
  work text NOT NULL,
  language text NOT NULL,
  status text NOT NULL,
  raw_text_ingested boolean NOT NULL DEFAULT false,
  checksum text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS prophet(
  id text PRIMARY KEY,
  display_name text NOT NULL,
  quranic_name text NOT NULL,
  signature text NOT NULL,
  payload jsonb NOT NULL,
  source_version text NOT NULL
);

CREATE TABLE IF NOT EXISTS prophet_context(
  prophet_id text PRIMARY KEY REFERENCES prophet(id) ON DELETE CASCADE,
  religion_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  people_region_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  language_context jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS claim(
  id text PRIMARY KEY,
  prophet_id text REFERENCES prophet(id),
  category text NOT NULL,
  statement text NOT NULL,
  confidence double precision NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  uncertainty_reasons jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS claim_source_ref(
  claim_id text NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
  source_id text NOT NULL REFERENCES corpus_source(id),
  edition_id text REFERENCES source_edition(edition_id),
  ref text NOT NULL,
  evidence text NOT NULL,
  relation text,
  note text,
  PRIMARY KEY(claim_id,source_id,ref)
);

CREATE TABLE IF NOT EXISTS graph_edge(
  id text PRIMARY KEY,
  from_id text NOT NULL,
  to_id text NOT NULL,
  edge_type text NOT NULL,
  evidence text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS event_node(
  id text PRIMARY KEY,
  prophet_id text NOT NULL REFERENCES prophet(id),
  slot text NOT NULL,
  summary text NOT NULL,
  evidence text NOT NULL,
  era text NOT NULL,
  era_confidence double precision NOT NULL CHECK(era_confidence BETWEEN 0 AND 1),
  refs jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS genealogy_relation(
  id text PRIMARY KEY,
  from_id text NOT NULL,
  to_id text NOT NULL,
  kind text NOT NULL,
  confidence text NOT NULL,
  refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS conflict_case(
  id text PRIMARY KEY,
  subject text NOT NULL,
  conflict_type text NOT NULL,
  severity double precision NOT NULL CHECK(severity BETWEEN 0 AND 1),
  scope text NOT NULL,
  payload jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS uncertainty_record(
  id bigserial PRIMARY KEY,
  subject_id text NOT NULL,
  uncertainty double precision NOT NULL CHECK(uncertainty BETWEEN 0 AND 1),
  confidence double precision NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  engine_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pairwise_preference(
  id bigserial PRIMARY KEY,
  respondent_hash text,
  trait_a text NOT NULL,
  trait_b text NOT NULL,
  winner text NOT NULL,
  country text,
  language text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(trait_a<>trait_b),
  CHECK(winner=trait_a OR winner=trait_b)
);

CREATE TABLE IF NOT EXISTS score_snapshot(
  id bigserial PRIMARY KEY,
  metric text NOT NULL,
  subject_id text NOT NULL,
  score double precision,
  status text NOT NULL,
  formula_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS documentation_entry(
  id text PRIMARY KEY,
  title text NOT NULL,
  path text NOT NULL,
  category text NOT NULL,
  status text NOT NULL,
  version text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_claim_prophet ON claim(prophet_id);
CREATE INDEX IF NOT EXISTS idx_claim_source_ref_source ON claim_source_ref(source_id);
CREATE INDEX IF NOT EXISTS idx_event_prophet ON event_node(prophet_id);
CREATE INDEX IF NOT EXISTS idx_graph_from ON graph_edge(from_id);
CREATE INDEX IF NOT EXISTS idx_graph_to ON graph_edge(to_id);
CREATE INDEX IF NOT EXISTS idx_score_metric_subject ON score_snapshot(metric,subject_id);
