"use client";

import { useEffect, useState } from "react";
import { EVENT_START } from "@/lib/birthday/event";

const UNITS = [
  ["days", 86_400_000],
  ["hours", 3_600_000],
  ["minutes", 60_000],
  ["seconds", 1_000],
] as const;

function split(ms: number): number[] {
  let left = Math.max(0, ms);
  return UNITS.map(([, size]) => {
    const value = Math.floor(left / size);
    left -= value * size;
    return value;
  });
}

/**
 * Time left until the party.
 *
 * Renders dashes until it has mounted: the answer depends on the reader's
 * clock, and prerendering a number the client immediately disagrees with is a
 * hydration mismatch.
 */
export function Countdown() {
  const [parts, setParts] = useState<number[] | null>(null);

  useEffect(() => {
    const tick = () => setParts(split(EVENT_START.getTime() - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const over = parts !== null && parts.every((value) => value === 0);

  return (
    <div
      className="flex gap-2 sm:gap-3"
      role="timer"
      aria-live="off"
      aria-label={
        over ? "The party has started" : "Time remaining until the party"
      }
    >
      {UNITS.map(([label], index) => (
        <div
          key={label}
          className="flex min-w-[62px] flex-1 flex-col items-center rounded-xl border border-white/12 bg-white/[0.045] px-2 py-3 backdrop-blur-md sm:min-w-[76px]"
        >
          <span className="block h-[1.15em] overflow-hidden font-mono text-2xl tabular-nums sm:text-3xl">
            {parts === null ? (
              "––"
            ) : (
              <span
                key={parts[index]}
                className="countdown-tick block leading-[1.15]"
              >
                {String(parts[index]).padStart(index === 0 ? 1 : 2, "0")}
              </span>
            )}
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/40 sm:text-[10px]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
