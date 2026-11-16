CREATE TABLE IF NOT EXISTS scheduler_jobs (id text PRIMARY KEY NOT NULL,name text NOT NULL,description text,executor text NOT NULL,target text NOT NULL,schedule_type text NOT NULL,cron_expression text,run_at text,timezone text NOT NULL,payload text NOT NULL,enabled integer DEFAULT true NOT NULL,status text DEFAULT 'active' NOT NULL,max_retries integer DEFAULT 0 NOT NULL,timeout_ms integer DEFAULT 30000 NOT NULL,allow_overlap integer DEFAULT false NOT NULL,last_run_at text,next_run_at text,created_at text NOT NULL,updated_at text NOT NULL);
CREATE INDEX IF NOT EXISTS scheduler_jobs_status_idx ON scheduler_jobs (status);
CREATE INDEX IF NOT EXISTS scheduler_jobs_next_run_idx ON scheduler_jobs (next_run_at);
CREATE TABLE IF NOT EXISTS scheduler_runs (id text PRIMARY KEY NOT NULL,job_id text NOT NULL,status text NOT NULL,attempt integer NOT NULL,started_at text,finished_at text,duration_ms integer,input text,output text,error text,created_at text NOT NULL);
CREATE INDEX IF NOT EXISTS scheduler_runs_job_idx ON scheduler_runs (job_id);
CREATE INDEX IF NOT EXISTS scheduler_runs_status_idx ON scheduler_runs (status);
CREATE TABLE IF NOT EXISTS scheduler_claims (job_id text PRIMARY KEY NOT NULL,owner text NOT NULL,claimed_until integer NOT NULL);
