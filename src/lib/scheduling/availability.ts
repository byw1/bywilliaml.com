import type { DateTime } from "luxon";
import { query } from "../db";
import { getConnection, providerFor, type BusyInterval } from "../providers";
import { clampRange, normalise, slotsFrom } from "./rules";
import type { BookingType, Slot } from "./types";

export { slotsFrom } from "./rules";

/**
 * Every window the host is unavailable across *all* connected calendars that
 * are flagged `blocks_time`, plus bookings this app has already taken.
 *
 * This is what stops a work meeting landing on top of a personal one: both
 * links consult the same union.
 */
export async function busyWindows(from: Date, to: Date): Promise<BusyInterval[]> {
  const calendars = await query<{ connection_id: string; remote_id: string }>(
    `SELECT connection_id, remote_id FROM calendars WHERE blocks_time = true`,
  );

  const byConnection = new Map<string, string[]>();
  for (const calendar of calendars) {
    const list = byConnection.get(calendar.connection_id) ?? [];
    list.push(calendar.remote_id);
    byConnection.set(calendar.connection_id, list);
  }

  const results = await Promise.allSettled(
    [...byConnection.entries()].map(async ([connectionId, remoteIds]) => {
      const row = await getConnection(connectionId);
      if (!row) return [];
      return providerFor(row).getBusy(remoteIds, from, to);
    }),
  );

  const intervals: BusyInterval[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      intervals.push(...result.value);
      continue;
    }
    // A calendar we can't read must not silently open up the schedule —
    // showing the slot as free risks a double-book, so fail loudly instead.
    throw new Error(
      `Could not read one of the connected calendars: ${result.reason}`,
    );
  }

  const booked = await query<{ starts_at: Date; ends_at: Date }>(
    `SELECT starts_at, ends_at FROM bookings
      WHERE status = 'confirmed' AND ends_at > $1 AND starts_at < $2`,
    [from, to],
  );
  intervals.push(
    ...booked.map((row) => ({ start: row.starts_at, end: row.ends_at })),
  );

  return normalise(intervals);
}

/**
 * Bookable start times for one booking type between two calendar dates
 * (inclusive), read in the booking type's own timezone.
 */
export async function availableSlots(
  type: BookingType,
  rangeStart: DateTime,
  rangeEnd: DateTime,
): Promise<Slot[]> {
  const { from, to } = clampRange(type, rangeStart, rangeEnd);
  if (!from || !to) return [];

  // Widen the busy lookup by the buffers so a meeting just outside the range
  // still blocks the first and last slots.
  const busy = await busyWindows(
    from.minus({ minutes: type.buffer_before_minutes + 60 }).toJSDate(),
    to.plus({ minutes: type.buffer_after_minutes + 60 }).toJSDate(),
  );

  return slotsFrom(type, rangeStart, rangeEnd, busy);
}
