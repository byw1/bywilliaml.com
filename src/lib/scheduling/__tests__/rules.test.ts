import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { slotsFrom } from "../rules.ts";
import type { BookingType } from "../types";

const ZONE = "America/Los_Angeles";

function makeType(overrides: Partial<BookingType> = {}): BookingType {
  return {
    id: "1",
    slug: "personal",
    title: "Chat",
    description: null,
    duration_minutes: 30,
    host_connection_id: "google:me@example.com",
    host_calendar_remote_id: "primary",
    time_zone: ZONE,
    availability: { "1": [["09:00", "12:00"]] }, // Mondays, 9–12
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
    min_notice_minutes: 0,
    max_days_ahead: 365,
    slot_increment_minutes: 30,
    max_per_day: null,
    is_active: true,
    ...overrides,
  };
}

/** Local wall-clock times of the returned slots, for readable assertions. */
function localTimes(slots: Array<{ start: string }>): string[] {
  return slots.map((slot) =>
    DateTime.fromISO(slot.start).setZone(ZONE).toFormat("HH:mm"),
  );
}

// 2026-03-09 and 2026-09-14 are Mondays; 2026-03-08 is the US spring-forward.
const MONDAY = DateTime.fromISO("2026-09-14T00:00:00", { zone: ZONE });
const NOW = DateTime.fromISO("2026-09-01T08:00:00", { zone: ZONE });

test("generates back-to-back slots across the window", () => {
  const slots = slotsFrom(makeType(), MONDAY, MONDAY, [], NOW);
  assert.deepEqual(localTimes(slots), [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  ]);
});

test("a slot is not offered when it never fits before the window closes", () => {
  const type = makeType({ duration_minutes: 45, slot_increment_minutes: 45 });
  const slots = slotsFrom(type, MONDAY, MONDAY, [], NOW);
  // 09:00, 09:45, 10:30 fit; 11:15 would end at 12:00 so it fits too.
  assert.deepEqual(localTimes(slots), ["09:00", "09:45", "10:30", "11:15"]);
});

test("busy time removes the overlapping slots only", () => {
  const busy = [
    {
      start: MONDAY.set({ hour: 10 }).toJSDate(),
      end: MONDAY.set({ hour: 11 }).toJSDate(),
    },
  ];
  const slots = slotsFrom(makeType(), MONDAY, MONDAY, busy, NOW);
  assert.deepEqual(localTimes(slots), ["09:00", "09:30", "11:00", "11:30"]);
});

test("a buffer after a meeting also clears the following slot", () => {
  const busy = [
    {
      start: MONDAY.set({ hour: 10 }).toJSDate(),
      end: MONDAY.set({ hour: 10, minute: 30 }).toJSDate(),
    },
  ];
  const slots = slotsFrom(
    makeType({ buffer_after_minutes: 15, buffer_before_minutes: 15 }),
    MONDAY,
    MONDAY,
    busy,
    NOW,
  );
  // 09:30 (ends 10:00, +15 buffer) and 10:30 (starts 10:30, −15) both collide.
  assert.deepEqual(localTimes(slots), ["09:00", "11:00", "11:30"]);
});

test("minimum notice hides slots that are too soon", () => {
  const now = MONDAY.set({ hour: 8 });
  const slots = slotsFrom(
    makeType({ min_notice_minutes: 120 }),
    MONDAY,
    MONDAY,
    [],
    now,
  );
  assert.deepEqual(localTimes(slots), ["10:00", "10:30", "11:00", "11:30"]);
});

test("booking horizon caps how far ahead slots appear", () => {
  const slots = slotsFrom(
    makeType({ max_days_ahead: 1 }),
    MONDAY,
    MONDAY,
    [],
    NOW,
  );
  assert.deepEqual(slots, []);
});

test("max_per_day stops after the configured count", () => {
  const slots = slotsFrom(makeType({ max_per_day: 2 }), MONDAY, MONDAY, [], NOW);
  assert.equal(slots.length, 2);
});

test("days with no configured hours produce nothing", () => {
  const sunday = MONDAY.minus({ days: 1 });
  const slots = slotsFrom(makeType(), sunday, sunday, [], NOW);
  assert.deepEqual(slots, []);
});

test("spring-forward keeps slots on real instants an hour apart", () => {
  // 2026-03-08 02:00 PST → 03:00 PDT. The Sunday window spans the gap.
  const springForward = DateTime.fromISO("2026-03-08T00:00:00", { zone: ZONE });
  const type = makeType({
    availability: { "7": [["01:00", "04:00"]] },
    slot_increment_minutes: 60,
    duration_minutes: 60,
  });
  const slots = slotsFrom(
    type,
    springForward,
    springForward,
    [],
    DateTime.fromISO("2026-03-01T00:00:00", { zone: ZONE }),
  );

  // Every offered slot must be a distinct, real instant — no duplicates from
  // the skipped hour, and each start exactly 60 real minutes after the last.
  const starts = slots.map((slot) => DateTime.fromISO(slot.start).toMillis());
  assert.equal(new Set(starts).size, starts.length, "duplicate instants");
  for (let i = 1; i < starts.length; i += 1) {
    assert.equal(starts[i] - starts[i - 1], 3_600_000);
  }
  assert.ok(starts.length > 0);
});

test("fall-back does not offer the ambiguous hour twice", () => {
  // 2026-11-01 02:00 PDT → 01:00 PST; 01:00–02:00 happens twice.
  const fallBack = DateTime.fromISO("2026-11-01T00:00:00", { zone: ZONE });
  const type = makeType({
    availability: { "7": [["00:00", "04:00"]] },
    slot_increment_minutes: 60,
    duration_minutes: 60,
  });
  const slots = slotsFrom(
    type,
    fallBack,
    fallBack,
    [],
    DateTime.fromISO("2026-10-25T00:00:00", { zone: ZONE }),
  );

  const starts = slots.map((slot) => DateTime.fromISO(slot.start).toMillis());
  assert.equal(new Set(starts).size, starts.length, "duplicate instants");
});

test("overlapping busy windows merge instead of double-counting", () => {
  const busy = [
    {
      start: MONDAY.set({ hour: 9 }).toJSDate(),
      end: MONDAY.set({ hour: 10 }).toJSDate(),
    },
    {
      start: MONDAY.set({ hour: 9, minute: 30 }).toJSDate(),
      end: MONDAY.set({ hour: 11 }).toJSDate(),
    },
  ];
  const slots = slotsFrom(makeType(), MONDAY, MONDAY, busy, NOW);
  assert.deepEqual(localTimes(slots), ["11:00", "11:30"]);
});
