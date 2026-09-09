-- RSVPs for the birthday page (/birthday).
--
-- Privacy note: name, message and plus_one are read back onto the public guest
-- wall. phone and email never leave the server — see src/lib/birthday/rsvps.ts,
-- where the public query selects columns explicitly rather than SELECT *.
CREATE TABLE IF NOT EXISTS birthday_rsvps (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  message     TEXT,
  plus_one    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One RSVP per person. A second submission from the same address updates the
-- first rather than posting a duplicate name to the wall.
CREATE UNIQUE INDEX IF NOT EXISTS birthday_rsvps_email_key
  ON birthday_rsvps (lower(email));

CREATE INDEX IF NOT EXISTS birthday_rsvps_created_at_idx
  ON birthday_rsvps (created_at);
