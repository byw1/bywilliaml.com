-- Scheduling schema: everything the booking pages and /admin need.
--
-- Design notes:
--  * OAuth refresh tokens are the crown jewels here, so they are stored
--    encrypted (AES-256-GCM, see src/lib/crypto.ts). The database never holds
--    a plaintext credential.
--  * Every instant is `timestamptz`. Wall-clock times appear only as the
--    "HH:mm" strings inside booking_types.availability, interpreted in
--    booking_types.time_zone.

CREATE TABLE IF NOT EXISTS connections (
  id             TEXT PRIMARY KEY,
  provider       TEXT        NOT NULL CHECK (provider IN ('google', 'zoho')),
  account_email  TEXT        NOT NULL,
  display_name   TEXT,
  access_token   TEXT,
  refresh_token  TEXT        NOT NULL,
  expires_at     TIMESTAMPTZ,
  scopes         TEXT,
  -- Zoho returns a per-datacentre API domain at token time (.com, .eu, .in are
  -- genuinely different hosts). Unused for Google.
  api_domain     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, account_email)
);

-- Calendars discovered under a connection. `blocks_time` is the switch that
-- makes cross-account conflict checking work: flip it on for every calendar
-- that should make you unbookable, regardless of which link is being booked.
CREATE TABLE IF NOT EXISTS calendars (
  id             BIGSERIAL PRIMARY KEY,
  connection_id  TEXT        NOT NULL REFERENCES connections (id) ON DELETE CASCADE,
  remote_id      TEXT        NOT NULL,
  summary        TEXT,
  time_zone      TEXT,
  is_primary     BOOLEAN     NOT NULL DEFAULT false,
  blocks_time    BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, remote_id)
);

-- One row per public booking link. `slug` is the URL: /meet/<slug>.
CREATE TABLE IF NOT EXISTS booking_types (
  id                      BIGSERIAL PRIMARY KEY,
  slug                    TEXT        NOT NULL UNIQUE,
  title                   TEXT        NOT NULL,
  description             TEXT,
  duration_minutes        INTEGER     NOT NULL DEFAULT 30,
  -- Which account creates the event, and therefore which address the calendar
  -- invitation arrives from. This is the whole point of having two links.
  host_connection_id      TEXT        REFERENCES connections (id) ON DELETE SET NULL,
  host_calendar_remote_id TEXT,
  time_zone               TEXT        NOT NULL DEFAULT 'America/Los_Angeles',
  -- { "1": [["09:00","17:00"]], ... } keyed by ISO weekday, 1 = Monday.
  availability            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  buffer_before_minutes   INTEGER     NOT NULL DEFAULT 0,
  buffer_after_minutes    INTEGER     NOT NULL DEFAULT 10,
  min_notice_minutes      INTEGER     NOT NULL DEFAULT 240,
  max_days_ahead          INTEGER     NOT NULL DEFAULT 30,
  slot_increment_minutes  INTEGER     NOT NULL DEFAULT 30,
  max_per_day             INTEGER,
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id                  TEXT PRIMARY KEY,
  booking_type_id     BIGINT      NOT NULL REFERENCES booking_types (id) ON DELETE CASCADE,
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  invitee_name        TEXT        NOT NULL,
  invitee_email       TEXT        NOT NULL,
  invitee_notes       TEXT,
  invitee_time_zone   TEXT,
  status              TEXT        NOT NULL DEFAULT 'confirmed'
                                  CHECK (status IN ('confirmed', 'cancelled')),
  meeting_url         TEXT,
  remote_event_id     TEXT,
  remote_calendar_id  TEXT,
  cancel_token        TEXT        NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at        TIMESTAMPTZ
);

-- Last line of defence against a double-book: two invitees racing for the same
-- slot on the same link cannot both land, whatever the calendar API says.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_double_book
  ON bookings (booking_type_id, starts_at)
  WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS bookings_starts_at_idx ON bookings (starts_at);
