CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  channel_id TEXT,
  thread_id TEXT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_platform ON sessions (platform);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions (last_active_at DESC);
