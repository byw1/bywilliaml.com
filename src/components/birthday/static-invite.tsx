import { EVENT } from "@/lib/birthday/event";

/**
 * The same invite, flat.
 *
 * Stands in for the hanging card whenever the 3-D scene shouldn't or can't run:
 * reduced-motion users, and any browser where WebGL or the model fails.
 */
export function StaticInvite() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="relative w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#14101a] via-[#0c0a10] to-[#08070b] px-7 pb-8 pt-9 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#f0b357]/20 blur-3xl"
        />
        <div aria-hidden className="relative mx-auto mb-7 h-1.5 w-14 rounded-full bg-white/25" />

        <p className="relative text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f0b357]">
          You&apos;re invited
        </p>
        <p className="relative mt-4 text-3xl font-semibold leading-none">
          {EVENT.host}&apos;s
        </p>
        <p className="relative text-3xl font-extralight leading-tight">birthday</p>

        <dl className="relative mt-6 space-y-3 border-t border-white/15 pt-5">
          {[
            ["When", `${EVENT.shortDateLabel} · ${EVENT.yearLabel}`],
            ["Time", `${EVENT.timeLabel} ${EVENT.timeZoneLabel}`],
            ["Where", EVENT.placeLabel],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[9px] uppercase tracking-[0.22em] text-white/40">
                {label}
              </dt>
              <dd className="mt-0.5 text-sm">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="relative mt-6 border-t border-dashed border-white/20 pt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f0b357]">
          Admit one
        </p>
      </div>
    </div>
  );
}
