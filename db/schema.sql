CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'FeelPulse Session',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
  id BIGSERIAL PRIMARY KEY,
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('engaged', 'neutral', 'lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS reactions_room_session_unique
ON reactions(room_code, session_id);

CREATE INDEX IF NOT EXISTS idx_reactions_room_created_at
ON reactions(room_code, created_at DESC);

CREATE TABLE IF NOT EXISTS questions (
  id BIGSERIAL PRIMARY KEY,
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_room_created_at
ON questions(room_code, created_at DESC);

CREATE TABLE IF NOT EXISTS summaries (
  id BIGSERIAL PRIMARY KEY,
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_summaries_room_created_at
ON summaries(room_code, created_at DESC);

-- Migration for older deployments that already had reactions without sessions.
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS session_id TEXT;
UPDATE reactions SET session_id = 'legacy-' || id::text WHERE session_id IS NULL;
ALTER TABLE reactions ALTER COLUMN session_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS reactions_room_session_unique
ON reactions(room_code, session_id);

-- Migration for host dashboard PIN protection.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_pin TEXT;
