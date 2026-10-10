"use client"

import dynamic from "next/dynamic"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion"
import { ArrowLeft, Lock, RotateCw } from "lucide-react"
import type { DogLayout, DogMood } from "@/components/date/dog-scene"
import { submitDate } from "./actions"

// three.js streams in after the page is already on screen; the dog pops in when it lands.
const DogScene = dynamic(() => import("@/components/date/dog-scene"), { ssr: false })

type Step = "ask" | "yes" | "when" | "food" | "activity" | "details" | "agreement" | "checkout" | "done"

const FOODS = [
  ["🍣", "sushi"],
  ["🍜", "ramen"],
  ["🌮", "tacos"],
  ["🍕", "pizza"],
  ["🍔", "burgers"],
  ["🥩", "korean bbq"],
  ["🍝", "pasta"],
  ["🥐", "brunch"],
  ["🍲", "hot pot"],
  ["🥗", "something healthy"],
  ["🍦", "dessert first"],
  ["🎲", "surprise me"],
] as const

const ACTIVITIES = [
  ["🎳", "bowling"],
  ["🎬", "a movie"],
  ["🖼️", "a museum"],
  ["🌅", "sunset walk"],
  ["🎤", "karaoke"],
  ["🕹️", "arcade"],
  ["⛳", "mini golf"],
  ["🏺", "pottery"],
  ["☕", "coffee + yap"],
  ["🛼", "roller skating"],
  ["🛋️", "couch + a show"],
  ["🎲", "surprise me"],
] as const

const TIMES = [
  { label: "11:00 am", h: 11, m: 0 },
  { label: "1:00 pm", h: 13, m: 0 },
  { label: "4:00 pm", h: 16, m: 0 },
  { label: "6:30 pm", h: 18, m: 30 },
  { label: "8:00 pm", h: 20, m: 0 },
  { label: "9:30 pm", h: 21, m: 30 },
]

/** What the dog says after each "no". The last line repeats. */
const BUBBLES = [
  "hi. quick question.",
  "hm. probably a misclick.",
  "i'm going to pretend i didn't see that.",
  "weird. must be your phone.",
  "okay. fresh start.",
  "the rose was for you btw.",
  "wow.",
  "both buttons say yes now. crazy how tech works.",
]

const NO_LABELS = ["no", "are you sure?", "like, sure sure?", "no", "try again", "no 🥀", "no", "yes"]

interface Answers {
  dayIso: string
  dayLabel: string
  time: (typeof TIMES)[number] | null
  food: readonly [string, string] | null
  activity: readonly [string, string] | null
  name: string
  phone: string
}

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function useTimedFlag(): [string | null, (msg: string, ms?: number) => void] {
  const [value, setValue] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const show = useCallback((msg: string, ms = 2400) => {
    clearTimeout(timer.current)
    setValue(msg)
    timer.current = setTimeout(() => setValue(null), ms)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return [value, show]
}

export function DateFlow() {
  const [step, setStep] = useState<Step>("ask")
  const [poster, setPoster] = useState(false)
  const [noCount, setNoCount] = useState(0)
  const [burst, setBurst] = useState(0)
  const [boop, setBoop] = useState(0)
  const [answers, setAnswers] = useState<Answers>({
    dayIso: "",
    dayLabel: "",
    time: null,
    food: null,
    activity: null,
    name: "",
    phone: "",
  })
  const [sendNote, setSendNote] = useState<string | null>(null)

  useEffect(() => {
    // Only used to shoot the link-preview image.
    if (new URLSearchParams(window.location.search).has("poster")) {
      const id = requestAnimationFrame(() => setPoster(true))
      return () => cancelAnimationFrame(id)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const go = (next: Step) => setStep(next)
  const sayYes = () => {
    setBurst((b) => b + 1)
    go("yes")
  }

  const compact = !["ask", "yes", "done"].includes(step)
  const layout: DogLayout = poster ? "poster" : compact ? "compact" : "hero"
  const mood: DogMood =
    step === "ask"
      ? noCount > 0
        ? "sad"
        : "idle"
      : step === "done"
        ? "party"
        : step === "yes"
          ? "happy"
          : step === "details" || step === "agreement" || step === "checkout"
            ? "idle"
            : "happy"

  return (
    <BoopContext.Provider value={() => setBoop((b) => b + 1)}>
      <LazyMotion features={domAnimation} strict>
        <style>{CSS}</style>
        <div aria-hidden className="date-bg fixed inset-0 -z-10" />
        {/* soft halo the dog stands in front of; also covers the moment before three.js loads */}
        <div
          aria-hidden
          className="pointer-events-none fixed left-1/2 -z-[5] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#ffc2d1_0%,rgba(255,194,209,0)_68%)] transition-all duration-700 ease-out"
          style={
            poster
              ? { top: "8%", left: "26%", width: 620, height: 620 }
              : compact
                ? { top: "0dvh", width: "34dvh", height: "22dvh" }
                : { top: "2dvh", width: "min(110vw, 62dvh)", height: "48dvh" }
          }
        />
        <DogScene mood={mood} sadness={noCount} layout={layout} burst={burst} boop={boop} />

        <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[calc(28px+env(safe-area-inset-bottom))] text-[#2b1720]">
          {poster ? (
            <Poster />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <m.section
                key={step}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col"
              >
                {step === "ask" && <Ask noCount={noCount} setNoCount={setNoCount} onYes={sayYes} />}
                {step === "yes" && <Yes noCount={noCount} onConfirm={() => go("when")} />}
                {step === "when" && (
                  <When
                    answers={answers}
                    onBack={() => go("yes")}
                    onPick={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
                    onNext={() => go("food")}
                  />
                )}
                {step === "food" && (
                  <Pick
                    n={2}
                    title="what are you feeling?"
                    sub="food-wise. pick one."
                    items={FOODS}
                    value={answers.food}
                    onBack={() => go("when")}
                    onPick={(food) => {
                      setAnswers((a) => ({ ...a, food }))
                      go("activity")
                    }}
                  />
                )}
                {step === "activity" && (
                  <Pick
                    n={3}
                    title="and after?"
                    sub="the part where we walk off the food."
                    items={ACTIVITIES}
                    value={answers.activity}
                    onBack={() => go("food")}
                    onPick={(activity) => {
                      setAnswers((a) => ({ ...a, activity }))
                      go("details")
                    }}
                  />
                )}
                {step === "details" && (
                  <Details
                    answers={answers}
                    noCount={noCount}
                    onBack={() => go("activity")}
                    onChange={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
                    onDone={(note) => {
                      setSendNote(note)
                      go("agreement")
                    }}
                  />
                )}
                {step === "agreement" && <Agreement answers={answers} noCount={noCount} note={sendNote} onNext={() => go("checkout")} />}
                {step === "checkout" && (
                  <Checkout
                    noCount={noCount}
                    onDone={() => {
                      setBurst((b) => b + 1)
                      go("done")
                    }}
                  />
                )}
                {step === "done" && <Done answers={answers} />}
              </m.section>
            </AnimatePresence>
          )}
        </main>
      </LazyMotion>
    </BoopContext.Provider>
  )
}

/** Escapes the step's animated container, whose transform would otherwise capture `position: fixed`. */
function Layer({ children }: { children: React.ReactNode }) {
  return createPortal(<div className="text-[#2b1720]">{children}</div>, document.body)
}

const BoopContext = createContext<() => void>(() => {})

/**
 * The empty band the dog stands in. It's a button so the dog can be booped,
 * and it sits inside the page so anything that wanders over it (like the
 * runaway "no") stays clickable.
 */
function DogSpace({ compact = false }: { compact?: boolean }) {
  const boop = useContext(BoopContext)
  return (
    <button
      type="button"
      aria-label="Boop the dog"
      onClick={boop}
      className={`block w-full shrink-0 outline-none [-webkit-tap-highlight-color:transparent] ${compact ? "h-[19dvh]" : "h-[41dvh] md:h-[44dvh]"}`}
    />
  )
}

/* ------------------------------------------------------------------ */

function Bubble({ text }: { text: string }) {
  return (
    <div className="relative mx-auto mb-4 w-fit max-w-[88%]">
      <div
        key={text}
        className="date-pop relative rounded-2xl bg-white px-4 py-2 text-center text-[14px] font-medium text-[#5b3a46] shadow-[0_8px_24px_-8px_rgba(160,40,80,0.35)]"
      >
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-white" />
        <span className="relative">{text}</span>
      </div>
    </div>
  )
}

function Ask({ noCount, setNoCount, onYes }: { noCount: number; setNoCount: (n: number) => void; onYes: () => void }) {
  const yesRef = useRef<HTMLButtonElement>(null)
  const noRef = useRef<HTMLButtonElement>(null)
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null)
  const [spin, setSpin] = useState(0)
  const [dodges, setDodges] = useState(0)
  const [reloading, setReloading] = useState(false)
  const [dialog, setDialog] = useState<null | "ask" | "heartless">(null)
  const [toast, showToast] = useTimedFlag()

  const swapped = noCount >= 7
  const label = NO_LABELS[Math.min(noCount, NO_LABELS.length - 1)]
  const small = noCount === 6

  /** Somewhere on screen that isn't on top of the yes button. */
  const flee = () => {
    const btn = noRef.current
    const yes = yesRef.current?.getBoundingClientRect()
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const w = r.width
    const h = r.height
    const vw = window.innerWidth
    const vh = window.innerHeight
    let target = { x: 16, y: vh - h - 32 }
    for (let i = 0; i < 40; i++) {
      const x = 16 + Math.random() * Math.max(0, vw - w - 32)
      const y = 24 + Math.random() * Math.max(0, vh - h - 72)
      const clear = !yes || x + w < yes.left - 20 || x > yes.right + 20 || y + h < yes.top - 20 || y > yes.bottom + 20
      const moved = Math.hypot(x - r.left, y - r.top) > Math.min(vw, vh) * 0.25
      if (clear && moved) {
        target = { x, y }
        break
      }
    }
    if (!noPos) {
      // Pin it where it is first, so the jump to the new spot animates.
      setNoPos({ x: r.left, y: r.top })
      requestAnimationFrame(() => requestAnimationFrame(() => setNoPos(target)))
    } else {
      setNoPos(target)
    }
  }

  const onNo = () => {
    if (swapped) return onYes()
    const n = noCount + 1
    setNoCount(n)
    navigator.vibrate?.(n >= 4 ? [30, 40, 30] : 20)
    if (n === 1) flee()
    if (n === 2) {
      setSpin((s) => s + 1)
      flee()
    }
    if (n === 3) {
      showToast("error: “no” isn’t supported on this device.")
      flee()
    }
    if (n === 4) {
      setReloading(true)
      setTimeout(() => {
        setNoPos(null)
        setReloading(false)
      }, 1900)
    }
    if (n === 5) setDialog("ask")
    if (n === 6) {
      setSpin((s) => s + 1)
      flee()
    }
    if (n === 7) setSpin((s) => s + 1)
  }

  const onHover = (e: React.PointerEvent) => {
    // The original meme, for people with a mouse. It gives up after a few
    // tries so the click gags still get their turn.
    if (e.pointerType !== "mouse" || dodges >= 3 || swapped || reloading) return
    setDodges((d) => d + 1)
    flee()
  }

  const yesScale = 1 + Math.min(noCount, 6) * 0.09

  const noButton = (
    <button
      ref={noRef}
      type="button"
      onClick={onNo}
      onPointerEnter={onHover}
      className="date-no z-40 outline-none [-webkit-tap-highlight-color:transparent]"
      style={
        noPos
          ? { position: "fixed", left: noPos.x, top: noPos.y, scale: small ? 0.62 : 1 }
          : { position: "relative", scale: small ? 0.62 : 1 }
      }
    >
      <span
        key={spin}
        className={`block whitespace-nowrap rounded-full border px-7 py-3.5 text-[16px] font-semibold shadow-[0_6px_18px_-8px_rgba(80,20,40,0.35)] ${
          swapped ? "border-transparent bg-[#ff3d6e] text-white" : "border-[#ecd3da] bg-white text-[#6b4552]"
        } ${spin ? "date-spin" : ""}`}
      >
        {label}
      </span>
    </button>
  )

  return (
    <>
      <DogSpace />
      <Bubble text={BUBBLES[Math.min(noCount, BUBBLES.length - 1)]} />
      <h1 className="text-balance text-center text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[40px]">
        will you go on a date with me?
      </h1>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          ref={yesRef}
          type="button"
          onClick={onYes}
          className="date-yes rounded-full bg-[#ff3d6e] px-9 py-3.5 text-[16px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(255,61,110,0.8)] outline-none transition-[scale] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] active:brightness-95"
          style={{ scale: yesScale }}
        >
          yes
        </button>
        {noPos ? (
          // Hold the space so "yes" doesn't jump when "no" leaves.
          <span aria-hidden className="invisible rounded-full px-7 py-3.5 text-[16px] font-semibold">
            no
          </span>
        ) : null}
        {noPos ? <Layer>{noButton}</Layer> : noButton}
      </div>

      {noCount > 0 && !swapped && (
        <p className="mt-auto pt-10 text-center text-[12px] text-[#b08593]">{noCount === 1 ? "1 attempt" : `${noCount} attempts`} logged</p>
      )}

      {/* fake reload */}
      {reloading && (
        <Layer>
          <div className="date-fade fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fff8f4]">
            <div className="date-bar fixed left-0 top-0 h-[3px] bg-[#ff3d6e]" />
            <RotateCw className="size-8 animate-spin text-[#ff3d6e]" />
            <p className="mt-4 text-[15px] font-medium text-[#6b4552]">reloading so you can try again…</p>
          </div>
        </Layer>
      )}

      {/* the are-you-sure dialog */}
      {dialog && (
        <Layer>
          <div className="date-fade fixed inset-0 z-50 flex items-center justify-center bg-[#2b1720]/30 px-6 backdrop-blur-sm [perspective:900px]">
            <div className="date-dialog w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl">
              <div className="text-4xl">{dialog === "ask" ? "💔" : "🙂"}</div>
              <p className="mt-3 text-[17px] font-semibold leading-snug">
                {dialog === "ask" ? "are you sure you want to break this dog’s heart?" : "that wasn’t one of the options."}
              </p>
              {dialog === "ask" && (
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDialog("heartless")
                      setTimeout(() => setDialog(null), 1400)
                    }}
                    className="rounded-full bg-[#2b1720] py-3 text-[15px] font-semibold text-white"
                  >
                    yes, i’m heartless
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="rounded-full bg-[#ffe4ea] py-3 text-[15px] font-semibold text-[#c2264f]"
                  >
                    no, take me back
                  </button>
                </div>
              )}
            </div>
          </div>
        </Layer>
      )}

      {toast && (
        <Layer>
          <div className="date-toast fixed inset-x-0 bottom-[calc(24px+env(safe-area-inset-bottom))] z-50 mx-auto w-fit max-w-[90vw] rounded-full bg-[#2b1720] px-5 py-3 text-center text-[14px] font-medium text-white shadow-xl">
            ⚠️ {toast}
          </div>
        </Layer>
      )}
    </>
  )
}

function Yes({ noCount, onConfirm }: { noCount: number; onConfirm: () => void }) {
  const [panic, setPanic] = useState(0)
  return (
    <>
      <DogSpace />
      <h1 className="text-balance text-center text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[40px]">
        damn. you actually clicked yes.
      </h1>
      <p className="mx-auto mt-4 max-w-[30ch] text-balance text-center text-[16px] leading-relaxed text-[#7a5562]">
        haha. whatever. this isn’t cringe at all. let’s make it official before you change your mind.
      </p>
      {noCount > 0 && <p className="mt-3 text-center text-[13px] text-[#b08593]">(only took {noCount + 1} tries)</p>}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full max-w-xs rounded-full bg-[#ff3d6e] py-4 text-[16px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(255,61,110,0.8)] active:brightness-95"
        >
          confirm (no take-backs)
        </button>
        <button
          key={panic}
          type="button"
          onClick={() => setPanic((p) => p + 1)}
          className={`py-2 text-[14px] font-medium text-[#a07a87] ${panic ? "date-shake" : ""}`}
        >
          {panic === 0 ? "wait, i panicked" : panic === 1 ? "no refunds." : panic === 2 ? "still no." : "it’s happening. accept it."}
        </button>
      </div>
    </>
  )
}

function StepHeader({ n, title, sub, onBack }: { n: number; title: string; sub: string; onBack: () => void }) {
  return (
    <>
      <DogSpace compact />
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex items-center gap-1 rounded-full px-2 py-1.5 text-[13px] font-medium text-[#a07a87]"
        >
          <ArrowLeft className="size-4" /> back
        </button>
        <div className="flex gap-1.5" aria-label={`step ${n} of 4`}>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i <= n ? "w-5 bg-[#ff3d6e]" : "w-1.5 bg-[#f0d5dc]"}`} />
          ))}
        </div>
      </div>
      <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-0.03em]">{title}</h2>
      <p className="mt-1 text-[15px] text-[#8a6370]">{sub}</p>
    </>
  )
}

function When({
  answers,
  onBack,
  onPick,
  onNext,
}: {
  answers: Answers
  onBack: () => void
  onPick: (patch: Partial<Answers>) => void
  onNext: () => void
}) {
  // Built on the visitor's device, in their timezone. This step never renders on the server.
  const days = useMemo(() => {
    const start = new Date()
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const weekday = i === 0 ? "today" : i === 1 ? "tmrw" : d.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()
      const full =
        i === 0 ? "today" : i === 1 ? "tomorrow" : d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
      return { iso, weekday, num: d.getDate(), month: d.toLocaleDateString("en-US", { month: "short" }).toLowerCase(), full }
    })
  }, [])

  return (
    <>
      <StepHeader n={1} title="when are you free?" sub="pick a day. no pressure. (some pressure.)" onBack={onBack} />
      <div className="-mx-5 mt-5 flex snap-x gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d) => {
          const on = answers.dayIso === d.iso
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => onPick({ dayIso: d.iso, dayLabel: d.full })}
              className={`flex w-[62px] shrink-0 snap-start flex-col items-center rounded-2xl border py-2.5 transition-all duration-200 active:scale-95 ${
                on
                  ? "border-transparent bg-[#ff3d6e] text-white shadow-[0_10px_22px_-10px_rgba(255,61,110,0.9)]"
                  : "border-[#f0dbe1] bg-white/80 text-[#5b3a46]"
              }`}
            >
              <span className={`text-[11px] font-medium ${on ? "text-white/85" : "text-[#a07a87]"}`}>{d.weekday}</span>
              <span className="text-[22px] font-semibold leading-tight">{d.num}</span>
              <span className={`text-[11px] ${on ? "text-white/85" : "text-[#a07a87]"}`}>{d.month}</span>
            </button>
          )
        })}
      </div>

      <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#b08593]">time</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {TIMES.map((t) => {
          const on = answers.time?.label === t.label
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => onPick({ time: t })}
              className={`rounded-2xl border py-3 text-[15px] font-semibold transition-all duration-200 active:scale-95 ${
                on
                  ? "border-transparent bg-[#ff3d6e] text-white shadow-[0_10px_22px_-10px_rgba(255,61,110,0.9)]"
                  : "border-[#f0dbe1] bg-white/80 text-[#5b3a46]"
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={!answers.dayIso || !answers.time}
          onClick={onNext}
          className="w-full rounded-full bg-[#2b1720] py-4 text-[16px] font-semibold text-white transition-opacity disabled:opacity-30"
        >
          {answers.dayIso && answers.time ? `${answers.dayLabel}, ${answers.time.label} →` : "pick a day and a time"}
        </button>
      </div>
    </>
  )
}

function Pick({
  n,
  title,
  sub,
  items,
  value,
  onBack,
  onPick,
}: {
  n: number
  title: string
  sub: string
  items: readonly (readonly [string, string])[]
  value: readonly [string, string] | null
  onBack: () => void
  onPick: (v: readonly [string, string]) => void
}) {
  const [chosen, setChosen] = useState<string | null>(value?.[1] ?? null)
  const [, startTransition] = useTransition()
  return (
    <>
      <StepHeader n={n} title={title} sub={sub} onBack={onBack} />
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {items.map((item) => {
          const on = chosen === item[1]
          return (
            <button
              key={item[1]}
              type="button"
              onClick={() => {
                setChosen(item[1])
                navigator.vibrate?.(10)
                // A beat to see the pick land before moving on.
                setTimeout(() => startTransition(() => onPick(item)), 380)
              }}
              className={`group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-3xl border transition-all duration-200 active:scale-95 ${
                on
                  ? "border-transparent bg-[#ff3d6e] text-white shadow-[0_14px_28px_-12px_rgba(255,61,110,0.9)]"
                  : "border-[#f0dbe1] bg-white/80 text-[#5b3a46]"
              }`}
            >
              <span className={`text-[38px] leading-none transition-transform duration-300 ${on ? "date-emoji-pop" : ""}`}>{item[0]}</span>
              <span className="px-1 text-center text-[12.5px] font-semibold leading-tight">{item[1]}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function Details({
  answers,
  noCount,
  onBack,
  onChange,
  onDone,
}: {
  answers: Answers
  noCount: number
  onBack: () => void
  onChange: (patch: Partial<Answers>) => void
  onDone: (note: string | null) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const honeypot = useRef<HTMLInputElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answers.name.trim()) return setError("i need a name for the paperwork.")
    if ((answers.phone.match(/\d/g) ?? []).length < 7) return setError("that number’s a little short.")
    setError(null)
    startTransition(async () => {
      let note: string | null = null
      try {
        const res = await submitDate({
          name: answers.name,
          phone: answers.phone,
          day: answers.dayLabel,
          time: answers.time?.label ?? "",
          food: answers.food?.[1] ?? "",
          activity: answers.activity?.[1] ?? "",
          noClicks: noCount,
          website: honeypot.current?.value,
        })
        if (!res.ok) note = res.message
      } catch {
        note = "it didn’t go through on my end. screenshot this and text it to me."
      }
      onDone(note)
    })
  }

  const field =
    "w-full rounded-2xl border border-[#f0dbe1] bg-white px-4 py-4 text-[17px] text-[#2b1720] outline-none transition-shadow placeholder:text-[#c4a3ae] focus:border-[#ff9db5] focus:shadow-[0_0_0_4px_rgba(255,61,110,0.12)]"

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <StepHeader n={4} title="last thing." sub="where should i send the confirmation?" onBack={onBack} />
      <div className="mt-6 flex flex-col gap-3">
        <input
          className={field}
          placeholder="your name"
          autoComplete="given-name"
          value={answers.name}
          maxLength={80}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <input
          className={field}
          placeholder="phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={answers.phone}
          maxLength={32}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
        <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        {error && <p className="date-shake text-[14px] font-medium text-[#d61f4f]">{error}</p>}
        <p className="text-[12.5px] leading-relaxed text-[#b08593]">used for exactly one thing: texting you about this date.</p>
      </div>
      <div className="mt-auto pt-8">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#2b1720] py-4 text-[16px] font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {pending ? "locking it in…" : "lock it in"}
        </button>
      </div>
    </form>
  )
}

function Agreement({ answers, noCount, note, onNext }: { answers: Answers; noCount: number; note: string | null; onNext: () => void }) {
  const [signed, setSigned] = useState(false)
  const [ref] = useState(() => String(Math.floor(100000 + Math.random() * 900000)))
  const name = answers.name.trim() || "you"
  const terms = [
    <>
      The date is <b>{answers.dayLabel}</b> at <b>{answers.time?.label}</b>.
    </>,
    <>
      We get{" "}
      <b>
        {answers.food?.[0]} {answers.food?.[1]}
      </b>
      , then{" "}
      <b>
        {answers.activity?.[0]} {answers.activity?.[1]}
      </b>
      .
    </>,
    noCount > 0 ? (
      <>
        The undersigned clicked “no”{" "}
        <b>
          {noCount} time{noCount === 1 ? "" : "s"}
        </b>{" "}
        and agrees that we never speak of it.
      </>
    ) : (
      <>The undersigned clicked “yes” on the first try. This has been noted.</>
    ),
    <>Phones go face down at the table. Mostly.</>,
    <>If it’s awkward, we blame the restaurant.</>,
    <>The dog keeps the rose.</>,
  ]
  return (
    <>
      <DogSpace compact />
      <div className="[perspective:1200px]">
        <div className="date-paper relative rounded-[22px] bg-[#fffdf9] p-6 shadow-[0_30px_60px_-30px_rgba(120,30,60,0.45),0_0_0_1px_rgba(120,30,60,0.06)]">
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#ff3d6e]">date agreement</p>
            <p className="font-mono text-[11px] text-[#b08593]">no. {ref}</p>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-[#6b4552]">
            Between <b>William</b> (“the asker”) and <b>{name}</b> (“the one who clicked yes”).
          </p>
          <ol className="mt-4 space-y-2.5 text-[13.5px] leading-snug text-[#3d2530]">
            {terms.map((t, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="font-mono text-[12px] text-[#c4a3ae]">{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => {
              setSigned(true)
              navigator.vibrate?.(15)
            }}
            className="mt-6 block w-full border-b-2 border-dashed border-[#e7c9d2] pb-1 text-left"
            aria-label="Sign the agreement"
          >
            <span className="block h-12">
              {signed ? (
                <span className="date-sign block text-[34px] leading-[48px] text-[#2b1720]" style={{ fontFamily: "'Caveat', cursive" }}>
                  {name}
                </span>
              ) : (
                <span className="date-pulse block pt-3 text-[15px] font-semibold text-[#ff3d6e]">tap to sign ✍️</span>
              )}
            </span>
          </button>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#c4a3ae]">signature</p>
        </div>
      </div>
      {note && <p className="mt-4 rounded-2xl bg-[#ffe4ea] px-4 py-3 text-[13.5px] font-medium text-[#c2264f]">{note}</p>}
      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={!signed}
          onClick={onNext}
          className="w-full rounded-full bg-[#2b1720] py-4 text-[16px] font-semibold text-white transition-opacity disabled:opacity-30"
        >
          {signed ? "proceed to checkout →" : "sign to continue"}
        </button>
      </div>
    </>
  )
}

function Checkout({ noCount, onDone }: { noCount: number; onDone: () => void }) {
  const [tip, setTip] = useState(45)
  const [stage, setStage] = useState<"idle" | "processing" | "declined">("idle")
  const lines: [string, number, string?][] = [
    ["1× date with william", 500],
    ["rose (pre-owned, slightly chewed)", 49.99],
    ...(noCount > 0 ? [[`emotional damage (“no” × ${noCount})`, noCount * 25] as [string, number]] : []),
    ["reservation fee", 38],
    ["convenience fee", 19.99],
    ["fee for the convenience fee", 4.99],
    ["dog handling", 12.5],
  ]
  const subtotal = lines.reduce((s, l) => s + l[1], 0)
  const vibes = subtotal * 0.0975
  const tipAmt = subtotal * (tip / 100)
  const total = subtotal + vibes + tipAmt

  const pay = () => {
    setStage("processing")
    setTimeout(() => {
      setStage("declined")
      navigator.vibrate?.([40, 60, 40])
    }, 1700)
  }

  return (
    <>
      <DogSpace compact />
      <div className="flex items-center justify-between">
        <h2 className="text-[28px] font-semibold tracking-[-0.03em]">checkout</h2>
        <span className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#5f8f6a]">
          <Lock className="size-3" /> secure-ish
        </span>
      </div>

      <div className="mt-4 rounded-[22px] bg-white p-5 shadow-[0_20px_40px_-28px_rgba(120,30,60,0.5)]">
        <ul className="space-y-2.5 text-[14px]">
          {lines.map(([label, amt]) => (
            <li key={label} className="flex justify-between gap-4">
              <span className="text-[#5b3a46]">{label}</span>
              <span className="font-medium tabular-nums">{money(amt)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-4">
            <span className="text-[#5b3a46]">vibes tax (9.75%)</span>
            <span className="font-medium tabular-nums">{money(vibes)}</span>
          </li>
        </ul>

        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#b08593]">add a tip?</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {[25, 30, 35, 45].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTip(p)}
              className={`relative rounded-xl py-2.5 text-[14px] font-semibold transition-all ${
                tip === p ? "bg-[#2b1720] text-white" : "bg-[#fbf1f4] text-[#5b3a46]"
              }`}
            >
              {p}%
              {p === 45 && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ff3d6e] px-1.5 text-[9px] font-bold text-white">
                  popular
                </span>
              )}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setTip(45)} className="mt-1.5 text-[10px] text-[#d9bfc8]">
          no tip
        </button>

        <div className="mt-4 flex items-end justify-between border-t border-[#f3e3e8] pt-4">
          <span className="text-[14px] font-semibold">total</span>
          <span className="text-[30px] font-semibold tabular-nums tracking-[-0.03em]">{money(total)}</span>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={pay}
          disabled={stage !== "idle"}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2b1720] py-4 text-[16px] font-semibold text-white disabled:opacity-80"
        >
          {stage === "processing" ? (
            <>
              <RotateCw className="size-4 animate-spin" /> processing…
            </>
          ) : (
            `pay ${money(total)}`
          )}
        </button>
        <p className="mt-3 text-center text-[11px] text-[#c4a3ae]">by tapping pay you agree to everything, forever.</p>
      </div>

      {stage === "declined" && (
        <Layer>
          <div className="date-fade fixed inset-0 z-50 flex items-center justify-center bg-[#2b1720]/30 px-6 backdrop-blur-sm [perspective:900px]">
            <div className="date-dialog w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl">
              <div className="text-4xl">💳</div>
              <p className="mt-3 text-[19px] font-semibold">payment declined</p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#7a5562]">reason: it was a joke. it’s free. obviously.</p>
              <button
                type="button"
                onClick={onDone}
                className="mt-5 w-full rounded-full bg-[#ff3d6e] py-3 text-[15px] font-semibold text-white"
              >
                fine →
              </button>
            </div>
          </div>
        </Layer>
      )}
    </>
  )
}

function Done({ answers }: { answers: Answers }) {
  const addToCalendar = () => {
    if (!answers.dayIso || !answers.time) return
    const [y, mo, d] = answers.dayIso.split("-").map(Number)
    const start = new Date(y, mo - 1, d, answers.time.h, answers.time.m)
    const end = new Date(start.getTime() + 3 * 3600_000)
    // Floating local time: the event lands at the picked hour in whatever timezone they're in.
    const fmt = (dt: Date) =>
      `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, "0")}${String(dt.getDate()).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}${String(dt.getMinutes()).padStart(2, "0")}00`
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//bywilliaml.com//date//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@bywilliaml.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:date w/ william`,
      `DESCRIPTION:${answers.food?.[1] ?? ""}${answers.activity ? `, then ${answers.activity[1]}` : ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "date.ics"
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <>
      <DogSpace />
      <h1 className="text-center text-[40px] font-semibold leading-none tracking-[-0.04em]">it’s a date.</h1>
      <p className="mx-auto mt-4 max-w-[30ch] text-balance text-center text-[16px] leading-relaxed text-[#7a5562]">
        {answers.dayLabel}, {answers.time?.label}. {answers.food?.[0]} then {answers.activity?.[0]}. i’ll text you.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={addToCalendar}
          className="w-full max-w-xs rounded-full bg-[#2b1720] py-4 text-[16px] font-semibold text-white active:brightness-110"
        >
          add to calendar
        </button>
        <p className="text-[13px] text-[#b08593]">you can close this now. or boop the dog.</p>
      </div>
    </>
  )
}

function Poster() {
  return (
    <div className="fixed inset-y-0 right-0 flex w-[54%] flex-col justify-center pr-20">
      <p className="text-[22px] font-medium text-[#b0607a]">quick question</p>
      <h1 className="mt-3 text-[76px] font-semibold leading-[0.98] tracking-[-0.04em] text-[#2b1720]">will you go on a date with me?</h1>
      <div className="mt-10 flex gap-4">
        <span className="rounded-full bg-[#ff3d6e] px-12 py-5 text-[28px] font-semibold text-white shadow-[0_16px_36px_-12px_rgba(255,61,110,0.8)]">
          yes
        </span>
        <span className="rounded-full border-2 border-[#ecd3da] bg-white px-12 py-5 text-[28px] font-semibold text-[#6b4552]">no</span>
      </div>
    </div>
  )
}

const CSS = `
html, body { background: #fff5f1; }
.date-bg { background: radial-gradient(120% 70% at 50% 12%, #ffe1e9 0%, #fff1ee 48%, #fff7f2 100%); }
.date-no { transition: left .55s cubic-bezier(.34,1.56,.64,1), top .55s cubic-bezier(.34,1.56,.64,1), scale .4s cubic-bezier(.34,1.56,.64,1); }
.date-spin { animation: date-spin .75s cubic-bezier(.22,1,.36,1); transform-style: preserve-3d; }
@keyframes date-spin { from { transform: perspective(500px) rotateY(0) rotateX(0); } to { transform: perspective(500px) rotateY(720deg) rotateX(360deg); } }
.date-pop { animation: date-pop .45s cubic-bezier(.34,1.56,.64,1); }
@keyframes date-pop { from { opacity: 0; transform: translateY(6px) scale(.85); } to { opacity: 1; transform: none; } }
.date-fade { animation: date-fade .25s ease-out; }
@keyframes date-fade { from { opacity: 0; } }
.date-dialog { animation: date-dialog .55s cubic-bezier(.34,1.56,.64,1); transform-origin: 50% 100%; }
@keyframes date-dialog { from { opacity: 0; transform: rotateX(-55deg) translateY(40px) scale(.8); } to { opacity: 1; transform: none; } }
.date-toast { animation: date-toast .5s cubic-bezier(.34,1.56,.64,1); }
@keyframes date-toast { from { opacity: 0; transform: translateY(30px) scale(.9); } }
.date-bar { animation: date-bar 1.8s cubic-bezier(.4,0,.2,1) forwards; }
@keyframes date-bar { 0% { width: 0 } 60% { width: 72% } 85% { width: 88% } 100% { width: 100% } }
.date-shake { animation: date-shake .45s cubic-bezier(.36,.07,.19,.97); }
@keyframes date-shake { 10%,90% { transform: translateX(-2px) } 20%,80% { transform: translateX(4px) } 30%,50%,70% { transform: translateX(-6px) } 40%,60% { transform: translateX(6px) } }
.date-emoji-pop { animation: date-emoji-pop .4s cubic-bezier(.34,1.56,.64,1); }
@keyframes date-emoji-pop { 40% { transform: scale(1.35) rotate(-8deg); } }
.date-paper { animation: date-paper .8s cubic-bezier(.22,1,.36,1); transform-origin: 50% 0; }
@keyframes date-paper { from { opacity: 0; transform: rotateX(28deg) translateY(30px); } }
.date-sign { animation: date-sign 1s cubic-bezier(.65,0,.35,1) forwards; clip-path: inset(0 100% 0 0); }
@keyframes date-sign { to { clip-path: inset(0 0 0 0); } }
.date-pulse { animation: date-pulse 1.6s ease-in-out infinite; }
@keyframes date-pulse { 50% { opacity: .45; } }
.date-yes:active { transform: scale(.96); }
@media (prefers-reduced-motion: reduce) {
  .date-spin, .date-pop, .date-dialog, .date-toast, .date-shake, .date-emoji-pop, .date-paper, .date-pulse { animation: none; }
  .date-sign { animation-duration: .01s; }
}
`
