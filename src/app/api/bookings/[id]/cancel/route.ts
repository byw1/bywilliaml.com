import { NextResponse, type NextRequest } from "next/server";
import { BookingError, cancelBooking } from "@/lib/scheduling/bookings";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token") ?? "";

  try {
    await cancelBooking(id, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not cancel." }, { status: 500 });
  }
}
