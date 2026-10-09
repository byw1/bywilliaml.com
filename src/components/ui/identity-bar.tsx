"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Mail } from "lucide-react"

interface IdentityBarProps {
  name: string
  handle: string
  status: string
  email: string
  avatarSrc: string
  /** IANA zone for the live clock. */
  timeZone?: string
}

function useLocalTime(timeZone: string) {
  // Rendered empty on the server so a prerendered page never shows the time
  // the site happened to be built at; fills in on mount and ticks per minute.
  const [time, setTime] = useState("")
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [timeZone])
  return time
}

/** The homepage's floating identity bar: who, what they're up to, and how to reach them. */
export function IdentityBar({
  name,
  handle,
  status,
  email,
  avatarSrc,
  timeZone = "America/Los_Angeles",
}: IdentityBarProps) {
  const time = useLocalTime(timeZone)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: 2.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.045] py-1.5 pl-1.5 pr-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
    >
      <div className="relative size-10 shrink-0">
        <Image src={avatarSrc} alt={name} fill sizes="40px" className="rounded-full object-cover ring-1 ring-white/15" />
        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#101012] bg-emerald-400">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
        </span>
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1">
          <span className="truncate text-[15px] font-semibold tracking-tight text-white">{name}</span>
          <svg viewBox="0 0 22 22" aria-label="Verified" className="size-4 shrink-0">
            <path
              fill="#1D9BF0"
              d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
            />
          </svg>
        </div>
        <div className="flex items-center gap-1.5 truncate text-xs text-white/50">
          <span>{handle}</span>
          <span className="text-white/25">·</span>
          <span className="truncate text-white/70">{status}</span>
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end leading-tight sm:flex">
        <span className="min-w-[56px] text-right text-xs tabular-nums text-white/80">{time || " "}</span>
        <span className="text-[10px] uppercase tracking-widest text-white/35">LA</span>
      </div>

      <button
        onClick={copy}
        aria-label={copied ? "Email copied" : `Copy email ${email}`}
        className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-black transition-transform duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? "done" : "mail"}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {copied ? <Check className="size-4" /> : <Mail className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </motion.header>
  )
}
