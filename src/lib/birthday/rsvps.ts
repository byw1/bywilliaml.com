import { ensureMigrated, query } from "@/lib/db";

/** What a guest sees on the wall. No contact details, ever. */
export interface PublicRsvp {
  id: string;
  name: string;
  message: string | null;
  plus_one: boolean;
  created_at: Date;
}

export interface RsvpInput {
  name: string;
  phone: string;
  email: string;
  message: string | null;
  plusOne: boolean;
}

/**
 * The guest wall, oldest first, so the list reads as the order people replied
 * and a new RSVP always lands at the end.
 *
 * Columns are listed by hand rather than `SELECT *` — phone and email live in
 * the same table and this result is serialised straight into the page.
 */
export async function listPublicRsvps(): Promise<PublicRsvp[]> {
  await ensureMigrated();
  return query<PublicRsvp>(
    `SELECT id::text, name, message, plus_one, created_at
       FROM birthday_rsvps
      ORDER BY created_at ASC, id ASC`,
  );
}

/**
 * Records an RSVP, or updates the one already filed under that email.
 *
 * Returns whether the row was new, which is only used to change the wording of
 * the confirmation ("you're on the list" vs "updated").
 */
export async function saveRsvp(input: RsvpInput): Promise<{ created: boolean }> {
  await ensureMigrated();
  const rows = await query<{ created: boolean }>(
    `INSERT INTO birthday_rsvps (name, phone, email, message, plus_one)
          VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (lower(email)) DO UPDATE
             SET name       = EXCLUDED.name,
                 phone      = EXCLUDED.phone,
                 message    = EXCLUDED.message,
                 plus_one   = EXCLUDED.plus_one,
                 updated_at = now()
       RETURNING (xmax = 0) AS created`,
    [input.name, input.phone, input.email, input.message, input.plusOne],
  );
  return { created: rows[0]?.created ?? true };
}

/** Heads, counting the plus-ones. */
export function headcount(rsvps: Pick<PublicRsvp, "plus_one">[]): number {
  return rsvps.reduce((total, rsvp) => total + (rsvp.plus_one ? 2 : 1), 0);
}
