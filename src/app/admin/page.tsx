import type { Metadata } from "next";
import { query } from "@/lib/db";
import { listConnections } from "@/lib/providers";
import { listBookingTypes } from "@/lib/scheduling/booking-types";
import { upcomingBookings } from "@/lib/scheduling/bookings";
import { readSession } from "@/lib/session";
import { missingSchedulingConfig, zohoConfigured } from "@/lib/env";
import {
  createBookingType,
  disconnectAccount,
  resyncCalendars,
  saveBookingType,
  setCalendarBlocking,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const WEEKDAYS = [
  [1, "Monday"],
  [2, "Tuesday"],
  [3, "Wednesday"],
  [4, "Thursday"],
  [5, "Friday"],
  [6, "Saturday"],
  [7, "Sunday"],
] as const;

const field =
  "w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm outline-none transition focus:border-white";
const card = "rounded-2xl border border-white/15 p-6";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const { error, connected } = await searchParams;

  const missing = missingSchedulingConfig();
  if (missing.length > 0) {
    return (
      <Shell>
        <div className={card}>
          <h2 className="text-lg font-medium">Not configured yet</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            {missing.length} variable{missing.length === 1 ? " is" : "s are"}{" "}
            still unset on this service:
          </p>
          <ul className="mt-3 space-y-1">
            {missing.map((name) => (
              <li key={name}>
                <code className="text-sm text-amber-300">{name}</code>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Set them and redeploy.{" "}
            <code className="text-white">SCHEDULING.md</code> explains where
            each one comes from.
          </p>
        </div>
      </Shell>
    );
  }

  const session = await readSession();
  if (!session) {
    return (
      <Shell>
        <div className={card}>
          <h2 className="text-lg font-medium">Sign in</h2>
          <p className="mt-2 text-sm text-white/60">
            Google accounts on the allowlist only.
          </p>
          {error ? (
            <p className="mt-4 rounded-lg border border-red-400/40 p-3 text-sm text-red-300">
              {error === "not_allowed"
                ? "That account isn't on the allowlist."
                : error}
            </p>
          ) : null}
          <a
            href="/api/admin/login"
            className="mt-6 block rounded-lg bg-white py-3 text-center text-sm font-medium text-black transition hover:bg-white/85"
          >
            Continue with Google
          </a>
        </div>
      </Shell>
    );
  }

  // listBookingTypes() applies any pending migrations, so a fresh deploy
  // needs no manual step.
  const [connections, types, bookings, calendars] = await Promise.all([
    listConnections(),
    listBookingTypes(),
    upcomingBookings(25),
    query<{
      id: string;
      connection_id: string;
      remote_id: string;
      summary: string | null;
      blocks_time: boolean;
    }>("SELECT * FROM calendars ORDER BY is_primary DESC, summary"),
  ]);

  return (
    <Shell email={session.email}>
      {error ? (
        <p className="rounded-lg border border-red-400/40 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {connected ? (
        <p className="rounded-lg border border-emerald-400/40 p-3 text-sm text-emerald-300">
          Connected your {connected} account.
        </p>
      ) : null}

      <section className={card}>
        <h2 className="text-lg font-medium">Accounts</h2>
        <p className="mt-1 text-sm text-white/50">
          Every calendar with <em>Blocks time</em> on makes you unbookable on
          both links, so work and personal never collide.
        </p>

        <div className="mt-5 space-y-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="rounded-xl border border-white/15 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{connection.account_email}</p>
                  <p className="text-xs uppercase tracking-wider text-white/40">
                    {connection.provider}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={resyncCalendars}>
                    <input type="hidden" name="connectionId" value={connection.id} />
                    <button className="rounded-lg border border-white/20 px-3 py-1.5 text-xs transition hover:border-white/50">
                      Resync
                    </button>
                  </form>
                  <form action={disconnectAccount}>
                    <input type="hidden" name="connectionId" value={connection.id} />
                    <button className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-400/10">
                      Disconnect
                    </button>
                  </form>
                </div>
              </div>

              <ul className="mt-3 space-y-1.5">
                {calendars
                  .filter((calendar) => calendar.connection_id === connection.id)
                  .map((calendar) => (
                    <li
                      key={calendar.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate text-white/70">
                        {calendar.summary ?? calendar.remote_id}
                      </span>
                      <form action={setCalendarBlocking}>
                        <input type="hidden" name="calendarId" value={calendar.id} />
                        <input
                          type="hidden"
                          name="blocks"
                          value={String(!calendar.blocks_time)}
                        />
                        <button
                          className={
                            calendar.blocks_time
                              ? "rounded-full border border-emerald-400/50 px-3 py-1 text-xs text-emerald-300"
                              : "rounded-full border border-white/20 px-3 py-1 text-xs text-white/40"
                          }
                        >
                          {calendar.blocks_time ? "Blocks time" : "Ignored"}
                        </button>
                      </form>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <a
              href="/api/connect/google"
              className="rounded-lg border border-white/25 px-4 py-2 text-sm transition hover:border-white"
            >
              + Connect a Google account
            </a>
            {zohoConfigured() ? (
              <a
                href="/api/connect/zoho"
                className="rounded-lg border border-white/25 px-4 py-2 text-sm transition hover:border-white"
              >
                + Connect Zoho
              </a>
            ) : (
              <span
                title="Set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET to enable this"
                className="cursor-not-allowed rounded-lg border border-white/10 px-4 py-2 text-sm text-white/30"
              >
                + Connect Zoho — needs ZOHO_CLIENT_ID
              </span>
            )}
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-medium">Booking links</h2>

        <div className="mt-5 space-y-5">
          {types.map((type) => (
            <form
              key={type.id}
              action={saveBookingType}
              className="rounded-xl border border-white/15 p-4"
            >
              <input type="hidden" name="id" value={type.id} />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <code className="text-sm text-white/50">/meet/{type.slug}</code>
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={type.is_active}
                  />
                  Live
                </label>
              </div>

              {!type.host_connection_id ? (
                <p className="mt-3 rounded-lg border border-amber-400/40 p-2.5 text-xs text-amber-300">
                  No calendar connected — this link can&apos;t take bookings yet.
                </p>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-white/50">
                  Title
                  <input name="title" defaultValue={type.title} className={`mt-1 ${field}`} />
                </label>
                <label className="text-xs text-white/50">
                  Writes to
                  <select
                    name="host"
                    defaultValue={`${type.host_connection_id ?? ""}|||${type.host_calendar_remote_id ?? ""}`}
                    className={`mt-1 ${field}`}
                  >
                    <option value="|||">— pick a calendar —</option>
                    {calendars.map((calendar) => (
                      <option
                        key={calendar.id}
                        value={`${calendar.connection_id}|||${calendar.remote_id}`}
                      >
                        {calendar.connection_id.split(":")[1]} ·{" "}
                        {calendar.summary ?? calendar.remote_id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-white/50">
                  Description
                  <input
                    name="description"
                    defaultValue={type.description ?? ""}
                    className={`mt-1 ${field}`}
                  />
                </label>
                <label className="text-xs text-white/50">
                  Time zone
                  <input name="time_zone" defaultValue={type.time_zone} className={`mt-1 ${field}`} />
                </label>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ["duration_minutes", "Duration", type.duration_minutes],
                  ["slot_increment_minutes", "Every", type.slot_increment_minutes],
                  ["buffer_after_minutes", "Buffer after", type.buffer_after_minutes],
                  ["min_notice_minutes", "Notice (min)", type.min_notice_minutes],
                  ["max_days_ahead", "Days ahead", type.max_days_ahead],
                ].map(([name, label, value]) => (
                  <label key={String(name)} className="text-xs text-white/50">
                    {label}
                    <input
                      name={String(name)}
                      type="number"
                      defaultValue={Number(value)}
                      className={`mt-1 ${field}`}
                    />
                  </label>
                ))}
              </div>

              <fieldset className="mt-4">
                <legend className="text-xs text-white/50">
                  Weekly hours — e.g. <code>09:00-12:00, 13:00-17:00</code>
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {WEEKDAYS.map(([weekday, label]) => (
                    <label
                      key={weekday}
                      className="flex items-center gap-2 text-xs text-white/50"
                    >
                      <span className="w-20 shrink-0">{label}</span>
                      <input
                        name={`day_${weekday}`}
                        defaultValue={(type.availability?.[String(weekday)] ?? [])
                          .map(([open, close]) => `${open}-${close}`)
                          .join(", ")}
                        placeholder="unavailable"
                        className={field}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <button className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">
                Save
              </button>
            </form>
          ))}
        </div>

        <form action={createBookingType} className="mt-5 flex flex-wrap gap-2">
          <input name="slug" placeholder="slug (e.g. work)" className={`${field} max-w-[180px]`} />
          <input name="title" placeholder="Title" className={`${field} max-w-[240px]`} />
          <button className="rounded-lg border border-white/25 px-4 py-2 text-sm transition hover:border-white">
            Add link
          </button>
        </form>
      </section>

      <section className={card}>
        <h2 className="text-lg font-medium">Upcoming</h2>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Nothing booked yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm"
              >
                <span>
                  {booking.starts_at.toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span className="text-white/60">
                  {booking.invitee_name} · {booking.invitee_email}
                </span>
                <code className="text-xs text-white/35">/{booking.slug}</code>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}

function Shell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Scheduling</h1>
        {email ? (
          <form action="/api/admin/logout" method="post">
            <span className="mr-3 text-sm text-white/40">{email}</span>
            <button className="rounded-lg border border-white/20 px-3 py-1.5 text-xs transition hover:border-white/50">
              Sign out
            </button>
          </form>
        ) : null}
      </header>
      <div className="space-y-6">{children}</div>
    </main>
  );
}
