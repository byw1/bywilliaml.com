import { DateTime } from "luxon";
import { query, queryOne, transaction } from "../db";
import { randomToken } from "../crypto";
import {
  anyGoogleConnection,
  getConnection,
  GoogleCalendarProvider,
  providerFor,
} from "../providers";
import { availableSlots } from "./availability";
import type { Booking, BookingType } from "./types";

export class BookingError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export interface BookingRequest {
  type: BookingType;
  start: Date;
  name: string;
  email: string;
  notes?: string;
  inviteeTimeZone?: string;
}

/**
 * Books a slot: re-checks availability, reserves the row, then writes the
 * event to whichever calendar hosts this link.
 *
 * The database row is created *before* the remote event so two people racing
 * for the same minute can't both get through — the loser hits the partial
 * unique index. If the calendar write then fails, the reservation is released.
 */
export async function createBooking(request: BookingRequest): Promise<Booking> {
  const { type, start } = request;

  if (!type.is_active) {
    throw new BookingError("This booking link is not currently taking meetings.");
  }
  if (!type.host_connection_id || !type.host_calendar_remote_id) {
    throw new BookingError(
      "This booking link has no calendar connected yet.",
      503,
    );
  }

  const end = new Date(start.getTime() + type.duration_minutes * 60_000);
  const startDateTime = DateTime.fromJSDate(start).setZone(type.time_zone);

  // Ask the engine for that exact day and require the requested instant to be
  // among the offered slots. Stops a hand-crafted POST from booking 3am.
  const offered = await availableSlots(type, startDateTime, startDateTime);
  const isOffered = offered.some(
    (slot) => new Date(slot.start).getTime() === start.getTime(),
  );
  if (!isOffered) {
    throw new BookingError(
      "That time was just taken or is no longer available. Pick another slot.",
      409,
    );
  }

  const id = randomToken(12);
  const cancelToken = randomToken(24);

  const reserved = await transaction(async (client) => {
    // Serialise concurrent bookings on this link so the availability re-check
    // above and the insert below can't interleave.
    await client.query("SELECT pg_advisory_xact_lock($1)", [Number(type.id)]);

    const existing = await client.query(
      `SELECT 1 FROM bookings
        WHERE booking_type_id = $1 AND starts_at = $2 AND status = 'confirmed'`,
      [type.id, start],
    );
    if (existing.rowCount) {
      throw new BookingError("That time was just booked by someone else.", 409);
    }

    const inserted = await client.query<Booking>(
      `INSERT INTO bookings
         (id, booking_type_id, starts_at, ends_at, invitee_name, invitee_email,
          invitee_notes, invitee_time_zone, cancel_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        type.id,
        start,
        end,
        request.name,
        request.email,
        request.notes ?? null,
        request.inviteeTimeZone ?? null,
        cancelToken,
      ],
    );
    return inserted.rows[0];
  });

  try {
    const connection = await getConnection(type.host_connection_id);
    if (!connection) throw new BookingError("Host account is missing.", 503);

    // Zoho can't mint a Google Meet link, so borrow a connected Google account
    // to create a standalone Meet space and hand the URL over.
    let meetingUrl: string | undefined;
    if (connection.provider !== "google") {
      const google = await anyGoogleConnection();
      if (google) {
        meetingUrl = await new GoogleCalendarProvider(google).createMeetSpace();
      }
    }

    const when = DateTime.fromJSDate(start)
      .setZone(type.time_zone)
      .toFormat("cccc d LLLL, h:mm a ZZZZ");

    const created = await providerFor(connection).createEvent({
      calendarId: type.host_calendar_remote_id,
      title: `${type.title} — ${request.name}`,
      description: [
        `Booked via bywilliaml.com/meet/${type.slug}`,
        `When: ${when}`,
        request.notes ? `\nNotes from ${request.name}:\n${request.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      start,
      end,
      timeZone: type.time_zone,
      attendee: { name: request.name, email: request.email },
      meetingUrl,
    });

    const updated = await queryOne<Booking>(
      `UPDATE bookings
          SET remote_event_id = $2, remote_calendar_id = $3, meeting_url = $4
        WHERE id = $1
        RETURNING *`,
      [
        id,
        created.remoteEventId,
        type.host_calendar_remote_id,
        created.meetingUrl ?? meetingUrl ?? null,
      ],
    );
    return updated ?? reserved;
  } catch (error) {
    // The calendar write failed, so don't leave a reservation blocking the slot.
    await query("DELETE FROM bookings WHERE id = $1", [id]);
    if (error instanceof BookingError) throw error;
    throw new BookingError(
      `Couldn't add the meeting to the calendar: ${(error as Error).message}`,
      502,
    );
  }
}

export async function getBooking(id: string): Promise<Booking | null> {
  return queryOne<Booking>("SELECT * FROM bookings WHERE id = $1", [id]);
}

export async function cancelBooking(
  id: string,
  cancelToken: string,
): Promise<void> {
  const booking = await getBooking(id);
  if (!booking || booking.cancel_token !== cancelToken) {
    throw new BookingError("Booking not found.", 404);
  }
  if (booking.status === "cancelled") return;

  if (booking.remote_event_id && booking.remote_calendar_id) {
    const type = await queryOne<BookingType>(
      "SELECT * FROM booking_types WHERE id = $1",
      [booking.booking_type_id],
    );
    const connection = type?.host_connection_id
      ? await getConnection(type.host_connection_id)
      : null;
    if (connection) {
      // A failure here shouldn't strand the invitee on a page they can't
      // leave; the row is marked cancelled either way and /admin shows it.
      await providerFor(connection)
        .deleteEvent(booking.remote_calendar_id, booking.remote_event_id)
        .catch(() => undefined);
    }
  }

  await query(
    "UPDATE bookings SET status = 'cancelled', cancelled_at = now() WHERE id = $1",
    [id],
  );
}

export async function upcomingBookings(limit = 50): Promise<
  Array<Booking & { type_title: string; slug: string }>
> {
  return query(
    `SELECT b.*, t.title AS type_title, t.slug
       FROM bookings b
       JOIN booking_types t ON t.id = b.booking_type_id
      WHERE b.ends_at > now() AND b.status = 'confirmed'
      ORDER BY b.starts_at
      LIMIT $1`,
    [limit],
  );
}
