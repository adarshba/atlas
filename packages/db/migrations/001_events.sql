CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  correlation_id TEXT,
  causation_id TEXT,
  user_id TEXT,
  session_id TEXT,
  platform TEXT,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events (type);
CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON events (correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events (timestamp DESC);
