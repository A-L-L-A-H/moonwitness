ALTER TABLE objects
    ADD COLUMN storage_backend TEXT NOT NULL DEFAULT 'filesystem';

ALTER TABLE objects
    ADD COLUMN storage_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_objects_storage_ref
    ON objects(storage_backend, storage_ref);
