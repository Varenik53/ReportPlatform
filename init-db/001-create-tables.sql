CREATE TABLE IF NOT EXISTS report_runs (
  id            UUID PRIMARY KEY,
  report_key    TEXT        NOT NULL,
  format        TEXT        NOT NULL,
  params_json   JSONB       NOT NULL DEFAULT '{}',
  status        TEXT        NOT NULL DEFAULT 'queued',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ,
  file_path     TEXT,
  file_name     TEXT,
  error_message TEXT
);
