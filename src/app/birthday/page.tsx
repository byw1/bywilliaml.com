import type { Metadata } from "next";
import Link from "next/link";
import { Countdown } from "@/components/birthday/countdown";
import { GuestWall } from "@/components/birthday/guest-wall";
import { InviteStage } from "@/components/birthday/invite-stage";
import { RsvpForm } from "@/components/birthday/rsvp-form";
import { EVENT } from "@/lib/birthday/event";
import { listPublicRsvps, type PublicRsvp } from "@/lib/birthday/rsvps";
import { databaseConfigured } from "@/lib/env";

// The guest wall is live data — a name added a minute ago has to be on the
// page a minute later, so nothing here may be cached at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${EVENT.host}'s birthday — RSVP`,
  description: `${EVENT.dayLabel}, ${EVENT.dateLabel}. Let me know if you're coming.`,
  // A party invite is for the people who have the link, not for search.
  robots: { index: false, follow: false },
};

const DETAILS = [
  {
    label: "When",
    value: `${EVENT.dayLabel}, ${EVENT.dateLabel}`,
    detail: `${EVENT.timeLabel} ${EVENT.timeZoneLabel} until late`,
  },
  {
    label: "Where",
    value: EVENT.placeLabel,
    detail: EVENT.placeDetail,
  },
  {
    label: "Wear",
    value: "Whatever you like",
    detail: EVENT.dressCode,
  },
];

export default async function BirthdayPage() {
  // The invite is the point of the page; the wall is a bonus. A database that
  // is unconfigured or briefly unreachable hides the list rather than taking
  // the whole invitation down with it.
  let guests: PublicRsvp[] = [];
  let wallReady = databaseConfigured();
  if (wallReady) {
    try {
      guests = await listPublicRsvps();
    } catch (error) {
      console.error("Birthday guest wall unavailable", error);
      wallReady = false;
    }
  }

  return (
    <main className="relative overflow-hidden">
      {/* One warm light source behind the whole page, to keep the black from
          reading as flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#f0b357]/10 blur-[140px]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-10">
          {/* The strap runs off the top of its box, so the scene column starts
              flush with the top of the page and looks hung from off-screen. */}
          <div className="order-1 h-[440px] w-full sm:h-[520px] lg:order-2 lg:h-[620px]">
            <InviteStage />
          </div>

          <div className="invite-rise order-2 pb-6 lg:order-1 lg:pt-24">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f0b357]">
              You&apos;re invited
            </p>
            <h1 className="mt-5 text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
              <span className="font-semibold">{EVENT.host}&apos;s</span>
              <br />
              <span className="font-extralight">birthday</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/55">
              The actual birthday is {EVENT.birthday}. We&apos;re celebrating on{" "}
              {EVENT.dayLabel} the 19th instead, which is the one to put in your
              calendar.
            </p>

            <div className="mt-8 max-w-md">
              <Countdown />
            </div>

            <a
              href="#rsvp"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:bg-white/85"
            >
              RSVP
              <span aria-hidden>↓</span>
            </a>
          </div>
        </section>

        <section className="mt-16 grid gap-3 sm:grid-cols-3">
          {DETAILS.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/12 bg-white/[0.025] p-6"
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                {item.label}
              </p>
              <p className="mt-3 text-lg font-medium">{item.value}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/45">
                {item.detail}
              </p>
            </div>
          ))}
        </section>

        <section
          id="rsvp"
          className="mt-20 grid scroll-mt-12 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16"
        >
          <div className="lg:pt-2">
            <h2 className="text-3xl font-medium sm:text-4xl">Are you in?</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              Name and note go on the wall below. Phone and email stay with me —
              they&apos;re how you get the address and any change of plan.
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/35">
              Changed your mind, or bringing someone after all? Send it again
              with the same email and it replaces your first answer.
            </p>
          </div>
          <RsvpForm />
        </section>

        {wallReady ? (
          <div className="mt-24">
            <GuestWall guests={guests} />
          </div>
        ) : null}

        <footer className="mt-24 border-t border-white/10 py-10 text-sm text-white/35">
          <Link href="/" className="transition hover:text-white">
            bywilliaml.com
          </Link>
        </footer>
      </div>
    </main>
  );
}
