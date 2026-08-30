import { NextResponse, type NextRequest } from "next/server";
import { getBookingTypeBySlug } from "@/lib/scheduling/booking-types";
import { BookingError, createBooking } from "@/lib/scheduling/bookings";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON" }, { status: 400 });
  }

  const slug = String(body.slug ?? "");
  const startRaw = String(body.start ?? "");
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const notes = body.notes ? String(body.notes).trim().slice(0, 2000) : undefined;
  const inviteeTimeZone = body.timeZone ? String(body.timeZone) : undefined;

  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Please give your name." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "That email address doesn't look right." },
      { status: 400 },
    );
  }

  const start = new Date(startRaw);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid start time." }, { status: 400 });
  }

  const type = await getBookingTypeBySlug(slug);
  if (!type) {
    return NextResponse.json({ error: "Unknown booking link." }, { status: 404 });
  }

  try {
    const booking = await createBooking({
      type,
      start,
      name,
      email,
      notes,
      inviteeTimeZone,
    });
    return NextResponse.json({
      id: booking.id,
      cancelToken: booking.cancel_token,
      meetingUrl: booking.meeting_url,
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Booking failed", error);
    return NextResponse.json(
      { error: "Something went wrong taking that booking." },
      { status: 500 },
    );
  }
}
