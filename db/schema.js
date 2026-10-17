export const schema = `
CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY,
  key_hash bytea NOT NULL UNIQUE,
  nickname varchar(16) NOT NULL DEFAULT '',
  nickname_updated_at bigint NOT NULL DEFAULT 0 CHECK (nickname_updated_at >= 0),
  researcher_message varchar(60) NOT NULL DEFAULT '',
  message_updated_at bigint NOT NULL DEFAULT 0 CHECK (message_updated_at >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visitors ADD COLUMN IF NOT EXISTS nickname varchar(16) NOT NULL DEFAULT '';
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS nickname_updated_at bigint NOT NULL DEFAULT 0 CHECK (nickname_updated_at >= 0);
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS researcher_message varchar(60) NOT NULL DEFAULT '';
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS message_updated_at bigint NOT NULL DEFAULT 0 CHECK (message_updated_at >= 0);

CREATE TABLE IF NOT EXISTS visitor_stats (
  visitor_id uuid PRIMARY KEY REFERENCES visitors(id) ON DELETE CASCADE,
  completed_rounds integer NOT NULL DEFAULT 0 CHECK (completed_rounds >= 0),
  best_sugar integer NOT NULL DEFAULT 0 CHECK (best_sugar BETWEEN 0 AND 99),
  best_mashes integer NOT NULL DEFAULT 0 CHECK (best_mashes >= 0),
  best_catches integer NOT NULL DEFAULT 0 CHECK (best_catches >= 0),
  catch_plays integer NOT NULL DEFAULT 0 CHECK (catch_plays >= 0),
  gauge_plays integer NOT NULL DEFAULT 0 CHECK (gauge_plays >= 0),
  precision_hits integer NOT NULL DEFAULT 0 CHECK (precision_hits >= 0),
  mash_plays integer NOT NULL DEFAULT 0 CHECK (mash_plays >= 0),
  memory_plays integer NOT NULL DEFAULT 0 CHECK (memory_plays >= 0),
  best_memory_moves integer NOT NULL DEFAULT 0 CHECK (best_memory_moves >= 0),
  memory_golds integer NOT NULL DEFAULT 0 CHECK (memory_golds >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visitor_stats ADD COLUMN IF NOT EXISTS best_catches integer NOT NULL DEFAULT 0 CHECK (best_catches >= 0);
ALTER TABLE visitor_stats ADD COLUMN IF NOT EXISTS catch_plays integer NOT NULL DEFAULT 0 CHECK (catch_plays >= 0);
ALTER TABLE visitor_stats ADD COLUMN IF NOT EXISTS memory_plays integer NOT NULL DEFAULT 0 CHECK (memory_plays >= 0);
ALTER TABLE visitor_stats ADD COLUMN IF NOT EXISTS best_memory_moves integer NOT NULL DEFAULT 0 CHECK (best_memory_moves >= 0);
ALTER TABLE visitor_stats ADD COLUMN IF NOT EXISTS memory_golds integer NOT NULL DEFAULT 0 CHECK (memory_golds >= 0);

CREATE INDEX IF NOT EXISTS visitors_last_seen_idx ON visitors(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS visitor_research (
  visitor_id uuid PRIMARY KEY REFERENCES visitors(id) ON DELETE CASCADE,
  research_record jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_score bigint NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  client_updated_at bigint NOT NULL DEFAULT 0 CHECK (client_updated_at >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visitor_research_ranking_idx
  ON visitor_research(total_score DESC, updated_at ASC)
  WHERE total_score > 0;
`
