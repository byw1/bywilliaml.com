import { ensureMigrated, query, queryOne } from "../db";
import type { BookingType } from "./types";

export async function listBookingTypes(): Promise<BookingType[]> {
  await ensureMigrated();
  return query<BookingType>(
    "SELECT * FROM booking_types ORDER BY is_active DESC, slug",
  );
}

export async function getBookingTypeBySlug(
  slug: string,
): Promise<BookingType | null> {
  await ensureMigrated();
  return queryOne<BookingType>("SELECT * FROM booking_types WHERE slug = $1", [
    slug,
  ]);
}

const EDITABLE = [
  "title",
  "description",
  "duration_minutes",
  "host_connection_id",
  "host_calendar_remote_id",
  "time_zone",
  "availability",
  "buffer_before_minutes",
  "buffer_after_minutes",
  "min_notice_minutes",
  "max_days_ahead",
  "slot_increment_minutes",
  "max_per_day",
  "is_active",
] as const;

/** Applies an allowlisted patch, so a stray form field can't rewrite a slug. */
export async function updateBookingType(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const columns = EDITABLE.filter((column) => column in patch);
  if (columns.length === 0) return;

  const assignments = columns.map((column, index) => `${column} = $${index + 2}`);
  const values = columns.map((column) =>
    column === "availability" ? JSON.stringify(patch[column]) : patch[column],
  );

  await query(
    `UPDATE booking_types SET ${assignments.join(", ")}, updated_at = now() WHERE id = $1`,
    [id, ...values],
  );
}
