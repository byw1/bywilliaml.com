"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InviteStage } from "./invite-stage";

/**
 * Puts the 3-D scene behind the whole page instead of inside a box.
 *
 * The canvas is fixed to the viewport and takes no pointer events of its own,
 * so the badge can swing the full width of the screen without being clipped by
 * a column, and every link and input on top of it still works. Pointer events
 * are read from the wrapper instead, which is what keeps the badge draggable.
 */
export function InviteBackdrop({ children }: { children: ReactNode }) {
  const page = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState(false);

  // Identity has to be stable: the scene subscribes to this from an effect.
  const onHeldChange = useCallback((next: boolean) => setHeld(next), []);

  return (
    <div ref={page} className="relative">
      <div
        className={cn(
          "pointer-events-none fixed inset-0 transition-[z-index]",
          // Normally the badge hangs behind the copy, which reads as depth.
          // While someone is actually holding it, it comes to the front — a
          // thing you have picked up should not slide behind the headline.
          held ? "z-20" : "z-0",
        )}
      >
        {/* One warm light source behind everything, to keep the black from
            reading as flat. */}
        <div
          aria-hidden
          className="absolute -top-40 left-1/2 h-[620px] w-[980px] -translate-x-1/2 rounded-full bg-[#f0b357]/10 blur-[150px]"
        />
        <InviteStage eventSource={page} onHeldChange={onHeldChange} />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
