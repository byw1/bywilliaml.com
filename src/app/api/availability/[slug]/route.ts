import { DateTime } from "luxon";
import { NextResponse, type NextRequest } from "next/server";
import { getBookingTypeBySlug } from "@/lib/scheduling/booking-types";
import { availableSlots } from "@/lib/scheduling/availability";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability/<slug>?from=2026-09-01&to=2026-09-30
 * Dates are plain calendar dates read in the booking type's timezone.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const type = await getBookingTypeBySlug(slug);

  if (!type || !type.is_active) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const from = DateTime.fromISO(params.get("from") ?? "", { zone: type.time_zone });
  const to = DateTime.fromISO(params.get("to") ?? "", { zone: type.time_zone });

  if (!from.isValid || !to.isValid) {
    return NextResponse.json(
      { error: "from and to must be ISO dates (YYYY-MM-DD)" },
      { status: 400 },
    );
  }
  // A month at a time is plenty and keeps the upstream free/busy calls small.
  if (to.diff(from, "days").days > 62) {
    return NextResponse.json(
      { error: "Range too wide — request at most 62 days" },
      { status: 400 },
    );
  }

  try {
    const slots = await availableSlots(type, from, to);
    return NextResponse.json(
      { timeZone: type.time_zone, durationMinutes: type.duration_minutes, slots },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 502 },
    );
  }
}
