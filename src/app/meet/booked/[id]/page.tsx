import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelButton } from "@/components/booking/cancel-button";
import { getBooking } from "@/lib/scheduling/bookings";
import { databaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You're booked — William L",
  // A booking page is per-person; keep it out of search results.
  robots: { index: false, follow: false },
};

export default async function BookedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  if (!databaseConfigured()) notFound();

  const { id } = await params;
  const { token } = await searchParams;

  const booking = await getBooking(id);
  if (!booking) notFound();

  // The token is what proves this visitor is the invitee rather than someone
  // guessing ids, so details stay hidden without it.
  const isInvitee = Boolean(token) && token === booking.cancel_token;
  if (!isInvitee) notFound();

  const cancelled = booking.status === "cancelled";
  const zone = booking.invitee_time_zone ?? "UTC";

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/15 p-8">
        <p className="text-4xl" aria-hidden>
          {cancelled ? "🗑️" : "✅"}
        </p>
        <h1 className="mt-4 text-2xl font-medium">
          {cancelled ? "Booking cancelled" : "You're booked"}
        </h1>

        {!cancelled ? (
          <>
            <p className="mt-5 text-sm text-white/70">
              {booking.starts_at.toLocaleString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
                timeZone: zone,
              })}
            </p>
            <p className="mt-2 text-sm text-white/50">
              A calendar invite is on its way to {booking.invitee_email}.
            </p>

            {booking.meeting_url ? (
              <a
                href={booking.meeting_url}
                className="mt-6 block rounded-lg bg-white py-3 text-center text-sm font-medium text-black transition hover:bg-white/85"
              >
                Join with Google Meet
              </a>
            ) : null}

            <CancelButton id={booking.id} token={booking.cancel_token} />
          </>
        ) : (
          <p className="mt-5 text-sm text-white/60">
            That time has been released. You&apos;re welcome to{" "}
            <Link href="/meet" className="underline">
              book another
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
