"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Hand } from "lucide-react"
import { GEAR, type GearId } from "@/app/setup/gear"

// The 3-D room is the only heavy thing on the page; it loads after first paint
// and never on the server.
const DeskScene = dynamic(() => import("./desk-scene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <div className="size-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
    </div>
  ),
})

export function SetupView() {
  const [active, setActive] = useState<GearId | null>(null)
  const cardRefs = useRef<Partial<Record<GearId, HTMLLIElement | null>>>({})

  // Picking something in the room scrolls its card into view, but only on wide
  // screens where the list sits beside the room rather than under it.
  useEffect(() => {
    if (!active || window.innerWidth < 1024) return
    cardRefs.current[active]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [active])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
      <div className="relative h-[56vh] min-h-[360px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#060608] lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:self-start">
        <DeskScene active={active} onSelect={setActive} />
        <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] text-white/60 backdrop-blur-md">
          <Hand className="size-3.5" aria-hidden />
          drag to look around · tap a number
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {GEAR.map((item, i) => {
          const on = active === item.id
          return (
            <li
              key={item.id}
              ref={(el) => {
                cardRefs.current[item.id] = el
              }}
              className="reveal reveal-in"
              style={{ animation: `project-card-in 600ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms both` }}
            >
              <div
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onClick={() => setActive(on ? null : item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setActive(on ? null : item.id)
                  }
                }}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                  on
                    ? "border-violet-400/40 bg-violet-500/[0.08] shadow-[0_0_40px_rgba(139,92,246,0.15)]"
                    : "border-white/[0.07] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums transition-colors duration-300 ${
                      on ? "bg-white text-black" : "bg-white/[0.07] text-white/60"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate font-medium text-white">{item.name}</h3>
                      <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/35">{item.category}</span>
                    </div>
                    <p className="text-xs text-white/45">{item.maker}</p>
                    <div
                      className={`grid transition-all duration-500 ${on ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 lg:mt-2 lg:grid-rows-[1fr] lg:opacity-100"}`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-[11px] uppercase tracking-wider text-white/40">{item.spec}</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-white/70">{item.note}</p>
                        {item.buyUrl && (
                          <a
                            href={item.buyUrl}
                            target="_blank"
                            rel="sponsored noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black transition-transform hover:scale-105"
                          >
                            Buy <ArrowUpRight className="size-3.5" aria-hidden />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
