-- The two links the site ships with. Both start inactive and unattached:
-- /admin is where they get pointed at a calendar and switched on.
INSERT INTO booking_types (slug, title, description, availability, is_active)
VALUES
  (
    'personal',
    'Coffee chat',
    'A 30-minute intro — anything you like.',
    '{"1":[["09:00","17:00"]],"2":[["09:00","17:00"]],"3":[["09:00","17:00"]],"4":[["09:00","17:00"]],"5":[["09:00","17:00"]]}'::jsonb,
    false
  ),
  (
    'work',
    'Work meeting',
    'A 30-minute slot on my work calendar.',
    '{"1":[["10:00","16:00"]],"2":[["10:00","16:00"]],"3":[["10:00","16:00"]],"4":[["10:00","16:00"]],"5":[["10:00","16:00"]]}'::jsonb,
    false
  )
ON CONFLICT (slug) DO NOTHING;
