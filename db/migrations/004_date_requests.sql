-- Answers from the /date page. Each submission is also emailed; this table is
-- the copy that survives a bounced or misconfigured email.
CREATE TABLE IF NOT EXISTS date_requests (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  day         TEXT        NOT NULL,
  time        TEXT        NOT NULL,
  food        TEXT        NOT NULL,
  activity    TEXT        NOT NULL,
  no_clicks   INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS date_requests_created_at_idx
  ON date_requests (created_at);
