"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { getConnection } from "@/lib/providers";
import { syncCalendars } from "@/lib/connect";
import { updateBookingType } from "@/lib/scheduling/booking-types";
import { requireAdmin } from "@/lib/session";
import type { WeeklyAvailability } from "@/lib/scheduling/types";

export async function setCalendarBlocking(formData: FormData): Promise<void> {
  await requireAdmin();
  await query("UPDATE calendars SET blocks_time = $2 WHERE id = $1", [
    formData.get("calendarId"),
    formData.get("blocks") === "true",
  ]);
  revalidatePath("/admin");
}

export async function resyncCalendars(formData: FormData): Promise<void> {
  await requireAdmin();
  const connection = await getConnection(String(formData.get("connectionId")));
  if (connection) await syncCalendars(connection);
  revalidatePath("/admin");
}

export async function disconnectAccount(formData: FormData): Promise<void> {
  await requireAdmin();
  // Booking types pointing at this account keep their row but lose their host,
  // which the admin page flags rather than silently taking bookings nowhere.
  await query("DELETE FROM connections WHERE id = $1", [
    formData.get("connectionId"),
  ]);
  revalidatePath("/admin");
}

/** Parses the seven "HH:mm-HH:mm, HH:mm-HH:mm" inputs into the JSON shape. */
function parseAvailability(formData: FormData): WeeklyAvailability {
  const availability: WeeklyAvailability = {};

  for (let weekday = 1; weekday <= 7; weekday += 1) {
    const raw = String(formData.get(`day_${weekday}`) ?? "").trim();
    if (!raw) continue;

    const windows: Array<[string, string]> = [];
    for (const chunk of raw.split(",")) {
      const [open, close] = chunk.trim().split("-").map((part) => part.trim());
      if (/^\d{2}:\d{2}$/.test(open) && /^\d{2}:\d{2}$/.test(close)) {
        windows.push([open, close]);
      }
    }
    if (windows.length) availability[String(weekday)] = windows;
  }
  return availability;
}

export async function saveBookingType(formData: FormData): Promise<void> {
  await requireAdmin();

  const host = String(formData.get("host") ?? "");
  // The host select carries "connectionId|||calendarRemoteId" so one control
  // sets both columns and they can never drift apart.
  const [hostConnectionId, hostCalendarRemoteId] = host.split("|||");

  await updateBookingType(String(formData.get("id")), {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    duration_minutes: Number(formData.get("duration_minutes")) || 30,
    host_connection_id: hostConnectionId || null,
    host_calendar_remote_id: hostCalendarRemoteId || null,
    time_zone: String(formData.get("time_zone") ?? "America/Los_Angeles"),
    availability: parseAvailability(formData),
    buffer_after_minutes: Number(formData.get("buffer_after_minutes")) || 0,
    min_notice_minutes: Number(formData.get("min_notice_minutes")) || 0,
    max_days_ahead: Number(formData.get("max_days_ahead")) || 30,
    slot_increment_minutes: Number(formData.get("slot_increment_minutes")) || 30,
    is_active: formData.get("is_active") === "on",
  });
  revalidatePath("/admin");
  revalidatePath("/meet");
}

export async function createBookingType(formData: FormData): Promise<void> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  // `booked` is taken by /meet/booked/<id>, so a link can't claim it.
  if (!slug || slug === "booked") return;

  await query(
    `INSERT INTO booking_types (slug, title, availability)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (slug) DO NOTHING`,
    [
      slug,
      String(formData.get("title") ?? "30-minute meeting"),
      JSON.stringify({
        "1": [["09:00", "17:00"]],
        "2": [["09:00", "17:00"]],
        "3": [["09:00", "17:00"]],
        "4": [["09:00", "17:00"]],
        "5": [["09:00", "17:00"]],
      }),
    ],
  );
  revalidatePath("/admin");
}
