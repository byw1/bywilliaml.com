import { DateTime, Interval } from "luxon";
import type { BusyInterval } from "../providers/types";
import type { BookingType, Slot } from "./types";

// Deliberately free of I/O and of any runtime import beyond Luxon: these are
// the scheduling rules themselves, so they stay directly testable.

/** Merges overlapping and touching intervals so the overlap test stays cheap. */
export function normalise(intervals: BusyInterval[]): BusyInterval[] {
  const sorted = [...intervals].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const merged: BusyInterval[] = [];
  for (const current of sorted) {
    const last = merged[merged.length - 1];
    if (last && current.start.getTime() <= last.end.getTime()) {
      if (current.end > last.end) last.end = current.end;
    } else {
      merged.push({ start: new Date(current.start), end: new Date(current.end) });
    }
  }
  return merged;
}

function overlapsBusy(
  start: DateTime,
  end: DateTime,
  busy: BusyInterval[],
): boolean {
  const window = Interval.fromDateTimes(start, end);
  return busy.some((interval) =>
    window.overlaps(
      Interval.fromDateTimes(
        DateTime.fromJSDate(interval.start),
        DateTime.fromJSDate(interval.end),
      ),
    ),
  );
}

/** Narrows a requested range to what the notice and horizon rules allow. */
export function clampRange(
  type: BookingType,
  rangeStart: DateTime,
  rangeEnd: DateTime,
  now: DateTime = DateTime.now().setZone(type.time_zone),
): { from: DateTime | null; to: DateTime | null } {
  const zone = type.time_zone;
  const earliest = now.plus({ minutes: type.min_notice_minutes });
  const latest = now.plus({ days: type.max_days_ahead }).endOf("day");

  const from = DateTime.max(rangeStart.setZone(zone).startOf("day"), earliest);
  const to = DateTime.min(rangeEnd.setZone(zone).endOf("day"), latest);
  return from >= to ? { from: null, to: null } : { from, to };
}

/**
 * Given the host's busy windows, which start times are bookable?
 *
 * Slot starts are built as wall-clock times in the booking type's zone and
 * then converted to instants, so a window that straddles a DST change yields
 * real, distinct instants rather than duplicated or skipped ones.
 */
export function slotsFrom(
  type: BookingType,
  rangeStart: DateTime,
  rangeEnd: DateTime,
  busy: BusyInterval[],
  now: DateTime = DateTime.now().setZone(type.time_zone),
): Slot[] {
  const earliest = now.plus({ minutes: type.min_notice_minutes });
  const latest = now.plus({ days: type.max_days_ahead }).endOf("day");

  const { from, to } = clampRange(type, rangeStart, rangeEnd, now);
  if (!from || !to) return [];

  const merged = normalise(busy);
  const perDayCount = new Map<string, number>();
  const seen = new Set<number>();
  const slots: Slot[] = [];

  for (let day = from.startOf("day"); day <= to; day = day.plus({ days: 1 })) {
    for (const [openTime, closeTime] of type.availability[String(day.weekday)] ?? []) {
      const [openHour, openMinute] = openTime.split(":").map(Number);
      const [closeHour, closeMinute] = closeTime.split(":").map(Number);

      const open = day.set({
        hour: openHour,
        minute: openMinute,
        second: 0,
        millisecond: 0,
      });
      const close = day.set({
        hour: closeHour,
        minute: closeMinute,
        second: 0,
        millisecond: 0,
      });
      if (!open.isValid || !close.isValid || close <= open) continue;

      for (
        let start = open;
        start.plus({ minutes: type.duration_minutes }) <= close;
        start = start.plus({ minutes: type.slot_increment_minutes })
      ) {
        const end = start.plus({ minutes: type.duration_minutes });
        if (!start.isValid || !end.isValid) continue;
        if (start < earliest || end > latest) continue;

        // On a fall-back day two wall-clock times map to the same instant;
        // offer it once.
        const instant = start.toMillis();
        if (seen.has(instant)) continue;

        const dayKey = start.toISODate() ?? "";
        if (
          type.max_per_day !== null &&
          (perDayCount.get(dayKey) ?? 0) >= type.max_per_day
        ) {
          continue;
        }

        const guardedStart = start.minus({ minutes: type.buffer_before_minutes });
        const guardedEnd = end.plus({ minutes: type.buffer_after_minutes });
        if (overlapsBusy(guardedStart, guardedEnd, merged)) continue;

        seen.add(instant);
        perDayCount.set(dayKey, (perDayCount.get(dayKey) ?? 0) + 1);
        slots.push({ start: start.toUTC().toISO()!, end: end.toUTC().toISO()! });
      }
    }
  }

  return slots;
}
