import { TiltCard } from "@/components/ui/tilt-card";
import type { PublicRsvp } from "@/lib/birthday/rsvps";
import { headcount } from "@/lib/birthday/rsvps";

/**
 * A hue in the warm end of the palette, fixed per name, so each guest gets a
 * consistent tint without pulling the page off its black-and-amber scheme.
 */
function warmHue(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 4096;
  }
  return 18 + (hash % 42);
}

function initial(name: string): string {
  return [...name.trim()][0]?.toUpperCase() ?? "?";
}

export function GuestWall({ guests }: { guests: PublicRsvp[] }) {
  const heads = headcount(guests);
  const plusOnes = guests.filter((guest) => guest.plus_one).length;

  return (
    <section aria-labelledby="guest-wall-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="guest-wall-heading" className="text-2xl font-medium sm:text-3xl">
          Who&apos;s coming
        </h2>
        <p className="text-sm text-white/45">
          {guests.length === 0
            ? "Nobody yet"
            : `${heads} ${heads === 1 ? "person" : "people"}` +
              (plusOnes > 0 ? ` · ${plusOnes} plus ${plusOnes === 1 ? "one" : "ones"}` : "")}
        </p>
      </div>

      {guests.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-white/40">
          The list is empty. Be the first name on it.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guests.map((guest, index) => {
            const hue = warmHue(guest.name);
            return (
              <li
                key={guest.id}
                className="guest-card"
                // Capped so a long list doesn't leave the last names waiting.
                style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
              >
                <TiltCard
                  tiltLimit={6}
                  scale={1.03}
                  effect="gravitate"
                  className="flex h-full gap-3.5 rounded-2xl border border-white/12 bg-white/[0.045] p-4 backdrop-blur-md transition-colors hover:border-white/30"
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                    style={{
                      background: `hsl(${hue} 70% 58% / 0.16)`,
                      color: `hsl(${hue} 80% 72%)`,
                    }}
                  >
                    {initial(guest.name)}
                  </span>

                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate font-medium">{guest.name}</span>
                      {guest.plus_one ? (
                        <span className="rounded-full border border-[#f0b357]/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#f0b357]">
                          +1
                        </span>
                      ) : null}
                    </p>
                    {guest.message ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-white/55 [overflow-wrap:anywhere]">
                        {guest.message}
                      </p>
                    ) : null}
                  </div>
                </TiltCard>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
