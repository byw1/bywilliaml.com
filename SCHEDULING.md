# Scheduling (`/meet` and `/admin`)

A self-hosted Calendly: public booking links at `/meet/<slug>`, an admin
dashboard at `/admin`, Google Meet links on every booking, and availability
computed from **every** connected calendar at once.

The point of the design is the last part. `/meet/personal` writes to Gmail and
`/meet/work` writes to Zoho, but both refuse any time either calendar is busy,
so a work meeting can never land on top of a personal one.

## How it fits together

```
/meet/<slug>  ──►  /api/availability/<slug>  ──►  free/busy from every
                                                  calendar flagged
                                                  "Blocks time"
                            │
                            ▼
                   /api/book  ──►  re-checks the slot, reserves a row,
                                   then writes the event to the one
                                   calendar that hosts this link
```

| Piece | Where |
| --- | --- |
| Scheduling rules (pure, unit-tested) | `src/lib/scheduling/rules.ts` |
| Free/busy union + slot query | `src/lib/scheduling/availability.ts` |
| Booking, cancellation, rollback | `src/lib/scheduling/bookings.ts` |
| Google Calendar + Meet | `src/lib/providers/google.ts` |
| Zoho Calendar | `src/lib/providers/zoho.ts` |
| Provider interface (add Outlook here) | `src/lib/providers/types.ts` |
| Admin session (HMAC cookie, allowlist) | `src/lib/session.ts` |
| Schema | `db/migrations/` |

### Why Zoho bookings still get a Google Meet link

Zoho Calendar can't mint a Meet link — it only knows Zoho Meeting. So when the
host calendar isn't Google, `createBooking` borrows any connected Google
account, calls the Meet REST API (`POST /v2/spaces`) to create a standalone
meeting space, and puts that URL on the Zoho event. The invite still comes from
the Zoho address; only the video link is minted on the Google side. This needs
at least one Google account connected, which the personal link provides anyway.

## Environment variables

None of these existed before; the marketing pages still build and render
without them, and `/admin` tells you what's missing.

| Variable | What it's for |
| --- | --- |
| `DATABASE_URL` | Postgres. On Railway, reference the Postgres service. |
| `SCHEDULING_ENCRYPTION_KEY` | 32 bytes base64. Encrypts OAuth refresh tokens at rest. |
| `SCHEDULING_SESSION_SECRET` | Signs the admin session and OAuth state cookies. |
| `ADMIN_EMAILS` | Comma-separated Google accounts allowed into `/admin`. |
| `APP_URL` | Absolute origin, e.g. `https://bywilliaml.com`. OAuth redirect URIs are built from it. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client. |
| `ZOHO_CLIENT_ID` / `ZOHO_CLIENT_SECRET` | Zoho API console client. |
| `ZOHO_ACCOUNTS_HOST` | Optional. Defaults to `https://accounts.zoho.com`; set to the `.eu`/`.in`/`.com.au` host if the Zoho account lives in that datacentre. |

Generate the two secrets with:

```bash
openssl rand -base64 32
```

## One-time setup

### 1. Database

Add a Postgres service to the Railway project and point `DATABASE_URL` at it
(`${{Postgres.DATABASE_URL}}`). Migrations run automatically the first time
`/admin` loads; `npm run migrate` does it manually.

### 2. Google Cloud console

1. Create (or reuse) a project at <https://console.cloud.google.com>.
2. Enable **Google Calendar API** and **Google Meet API**.
3. Configure the OAuth consent screen as **External**. It can stay in *Testing*
   — add every Google address you'll connect as a test user. Testing-mode
   refresh tokens expire after 7 days, so publish the app once it works, which
   makes them long-lived. (No verification review is needed while you're the
   only user.)
4. Create an **OAuth client ID** of type *Web application* with these
   authorised redirect URIs:
   - `https://bywilliaml.com/api/admin/callback`
   - `https://bywilliaml.com/api/connect/google/callback`
   - plus `http://localhost:3000/...` equivalents for local work.
5. Scopes requested: `calendar.events`, `calendar.readonly`,
   `meetings.space.created`, and `openid email profile`.

### 3. Zoho API console

1. Go to <https://api-console.zoho.com> and create a **Server-based
   Application**.
2. Authorized redirect URI: `https://bywilliaml.com/api/connect/zoho/callback`.
3. Copy the client ID and secret into the environment.
4. Scopes requested: `ZohoCalendar.calendar.READ`, `ZohoCalendar.event.ALL`,
   `ZohoCalendar.freebusy.READ`, `AaaServer.profile.READ`.

### 4. Connect the accounts

Open `/admin`, sign in with a Google account on `ADMIN_EMAILS`, then:

1. **Connect a Google account** — do this once per Google account (personal
   Gmail, and the `bywilliaml.com` Workspace account if you want it checked).
2. **Connect Zoho** — for the work calendar.
3. For every calendar listed, decide whether it **Blocks time**. Turn it on for
   anything that should make you unbookable; leave it off for calendars you
   subscribe to but don't attend (holidays, someone else's schedule).
4. For each booking link, choose the calendar it **writes to** — this is what
   decides which address the invitation comes from — set your weekly hours, and
   tick **Live**.

## Operating notes

- **A calendar that can't be read fails the whole availability request** rather
  than showing the slot as free. A visitor sees an error instead of booking on
  top of something. Reconnect the account in `/admin` when this happens.
- **Refresh tokens expire** if Google's consent screen is left in Testing mode
  (7 days) or if you revoke access. `/admin` → *Connect* re-authorises.
- **Double bookings** are blocked three ways: the slot is re-derived
  server-side before the write, a transaction-scoped advisory lock serialises
  concurrent attempts on the same link, and a partial unique index on
  `(booking_type_id, starts_at) WHERE status='confirmed'` is the last defence.
- **`booked` is a reserved slug** because `/meet/booked/<id>` is the
  confirmation page.
- **Cancelling** deletes the remote event and frees the slot. The invitee's
  link carries a `cancel_token`; without it the confirmation page 404s, so
  booking details aren't exposed by guessing IDs.

## Adding another calendar provider

Implement `CalendarProvider` (`listCalendars`, `getBusy`, `createEvent`,
`deleteEvent`), add the OAuth exchange, and add a case to `providerFor`. The
availability engine, booking flow, and admin UI need no changes — Outlook via
Microsoft Graph would be one file plus a `case`.

## Tests

```bash
npm test
```

Covers the scheduling rules directly, including both US DST transitions,
buffers, notice, horizon, per-day caps and busy-window merging.
