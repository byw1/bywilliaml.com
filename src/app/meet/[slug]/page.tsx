import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getBookingTypeBySlug } from "@/lib/scheduling/booking-types";
import { databaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!databaseConfigured()) return { title: "Book a meeting" };

  const type = await getBookingTypeBySlug(slug);
  return {
    title: type ? `${type.title} — William L` : "Book a meeting",
    description: type?.description ?? undefined,
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!databaseConfigured()) notFound();

  const type = await getBookingTypeBySlug(slug);
  if (!type || !type.is_active) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <BookingFlow
        slug={type.slug}
        title={type.title}
        description={type.description}
        durationMinutes={type.duration_minutes}
        hostTimeZone={type.time_zone}
      />
    </main>
  );
}
