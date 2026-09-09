import type { Metadata } from "next";
import Link from "next/link";
import { Countdown } from "@/components/birthday/countdown";
import { GuestWall } from "@/components/birthday/guest-wall";
import { InviteBackdrop } from "@/components/birthday/invite-backdrop";
import { Reveal } from "@/components/birthday/reveal";
import { RsvpForm } from "@/components/birthday/rsvp-form";
import { SignatureIntro } from "@/components/ui/signature-intro";
import { TiltCard } from "@/components/ui/tilt-card";
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
    <>
      <SignatureIntro />

      <InviteBackdrop>
        <main className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          {/* Stacked, the copy starts below where the badge hangs. Wide, it
              takes the left half and the badge has the right to itself. */}
          <section className="invite-rise pb-20 pt-[52vh] lg:max-w-xl lg:pb-28 lg:pt-40">
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
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:bg-white/85"
            >
              RSVP
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-y-0.5"
              >
                ↓
              </span>
            </a>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {DETAILS.map((item, index) => (
              <Reveal key={item.label} delay={index * 90}>
                <TiltCard
                  tiltLimit={7}
                  scale={1.03}
                  effect="gravitate"
                  className="h-full rounded-2xl border border-white/12 bg-white/[0.045] p-6 backdrop-blur-md"
                >
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                    {item.label}
                  </p>
                  <p className="mt-3 text-lg font-medium">{item.value}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/45">
                    {item.detail}
                  </p>
                </TiltCard>
              </Reveal>
            ))}
          </section>

          <section
            id="rsvp"
            className="mt-24 grid scroll-mt-12 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16"
          >
            <Reveal className="lg:pt-2">
              <h2 className="text-3xl font-medium sm:text-4xl">Are you in?</h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                Name and note go on the wall below. Phone and email stay with me
                — they&apos;re how you get the address and any change of plan.
              </p>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/35">
                Changed your mind, or bringing someone after all? Send it again
                with the same email and it replaces your first answer.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md sm:p-8">
                <RsvpForm />
              </div>
            </Reveal>
          </section>

          {wallReady ? (
            <Reveal className="mt-28 block">
              <GuestWall guests={guests} />
            </Reveal>
          ) : null}

          <footer className="mt-28 border-t border-white/10 py-10 text-sm text-white/35">
            <Link href="/" className="transition hover:text-white">
              bywilliaml.com
            </Link>
          </footer>
        </main>
      </InviteBackdrop>
    </>
  );
}
