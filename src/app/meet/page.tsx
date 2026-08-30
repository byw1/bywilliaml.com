import type { Metadata } from "next";
import Link from "next/link";
import { listBookingTypes } from "@/lib/scheduling/booking-types";
import { schedulingConfigured } from "@/lib/env";

// Availability is live data, so nothing here may be cached at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a meeting — William L",
  description: "Find a time that works.",
};

export default async function MeetIndex() {
  const types = schedulingConfigured() ? await listBookingTypes() : [];
  const active = types.filter((type) => type.is_active);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-medium">Book a meeting</h1>
        <p className="mt-3 text-white/60">
          Pick the link that fits — each one checks a different calendar.
        </p>

        <div className="mt-9 space-y-3">
          {active.map((type) => (
            <Link
              key={type.slug}
              href={`/meet/${type.slug}`}
              className="block rounded-xl border border-white/15 p-5 transition hover:border-white/50"
            >
              <p className="font-medium">{type.title}</p>
              <p className="mt-1 text-sm text-white/50">
                {type.duration_minutes} minutes
                {type.description ? ` · ${type.description}` : ""}
              </p>
            </Link>
          ))}

          {active.length === 0 ? (
            <p className="rounded-xl border border-white/15 p-5 text-sm text-white/50">
              No booking links are live yet.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
