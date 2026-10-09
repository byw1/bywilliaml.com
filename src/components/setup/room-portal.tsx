"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"

// three.js only loads once the card is about to scroll into view.
const RoomDiorama = dynamic(() => import("./room-diorama"), { ssr: false })

/**
 * The About page's doorway into /setup: a live miniature of the room,
 * floating and turning, that leans toward the pointer and opens the full
 * interactive room on click.
 */
export function RoomPortal() {
  const ref = useRef<HTMLAnchorElement>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting)
        if (e.isIntersecting) setNear(true)
      },
      { rootMargin: "300px 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    pointer.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 }
  }

  return (
    <Link
      ref={ref}
      href="/setup"
      aria-label="Explore my setup in 3D"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onPointerMove={onMove}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group relative block w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_40%,#1a1030_0%,#08070c_60%,#050506_100%)] outline-none transition-colors duration-500 hover:border-violet-400/30 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-[45%] size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-3xl transition-opacity duration-700 group-hover:opacity-100 opacity-60"
      />
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/11]">
        {near && <RoomDiorama hover={hover} visible={visible} pointer={pointer} />}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-16 sm:p-7 sm:pt-20">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-300/80">explore in 3D</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">My Setup</h3>
          <p className="mt-1 text-sm text-white/55">step inside — the desk, the gear, and what i&apos;d tell you to buy.</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-black transition-transform duration-500 group-hover:-rotate-45 group-hover:scale-110">
          <ArrowUpRight className="size-5" aria-hidden />
        </span>
      </div>
    </Link>
  )
}
