'use client'

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { AlertTriangle, Check, Copy, Download, Link2, Smartphone, Wand2 } from 'lucide-react'
import {
  LINK_PREFIX,
  MAX_QR_PARTS,
  QR_PAYLOAD_LIMIT,
  buildDeck,
  decodePayload,
  deckFileName,
  encodeDeck,
  parseLoose,
  isPayload,
  splitForQr,
  type Deck,
  type Issue,
} from '@/lib/charades/deck'
import { textOn } from './data'

type Made = { deck: Deck; payload: string; warnings: Issue[]; codes: string[] }

const EXAMPLE = `{
  "name": "Line Legends",
  "description": "Everything from our Disneyland trip.",
  "emoji": "🎢",
  "color": "teal",
  "cards": [
    "Churro",
    { "text": "Two-hour line", "banned": ["wait", "queue", "long"] },
    "Mouse ears", "Fireworks", "Pin trading", "Turkey leg",
    "Parade", "Castle", "Sunburn", "Rollercoaster"
  ]
}`

async function qr(text: string): Promise<string> {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'L', margin: 2, width: 720, color: { dark: '#0A0A0D', light: '#FFFFFF' } })
}

/**
 * Paste what any AI wrote, get a deck the app opens: a QR code to scan, a
 * .charades file and a link. All of it happens in this browser tab; the deck
 * is never uploaded. A deck can also arrive in the URL's #d= fragment, which
 * browsers never send to the server, so the Claude skill links straight here.
 */
export function DeckMaker() {
  const [input, setInput] = useState('')
  const [made, setMade] = useState<Made | null>(null)
  const [errors, setErrors] = useState<Issue[]>([])
  const [part, setPart] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const make = useCallback(async (text: string, fromLink = false) => {
    setBusy(true)
    setErrors([])
    try {
      const parsed = isPayload(text) ? await decodePayload(text) : parseLoose(text)
      const result = buildDeck(parsed)
      if (!result.ok) {
        setMade(null)
        setErrors(result.errors)
        return
      }
      const payload = await encodeDeck(result.deck)
      const pieces =
        payload.length <= QR_PAYLOAD_LIMIT ? [LINK_PREFIX + payload] : splitForQr(payload).slice(0, MAX_QR_PARTS + 1)
      const codes = pieces.length > MAX_QR_PARTS ? [] : await Promise.all(pieces.map(qr))
      setMade({ deck: result.deck, payload, warnings: result.warnings, codes })
      setPart(0)
      if (!fromLink) history.replaceState(null, '', `#d=${payload}`)
      requestAnimationFrame(() => document.getElementById('made')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (error) {
      setMade(null)
      setErrors([{ path: '', message: error instanceof Error ? error.message : 'That could not be read as a deck.' }])
    } finally {
      setBusy(false)
    }
  }, [])

  // A deck handed over in the link, from the Claude skill or a friend.
  useEffect(() => {
    const match = /[#&]d=([^&]+)/.exec(window.location.hash)
    if (match) void make(decodeURIComponent(match[1]), true)
  }, [make])

  // Big decks flip through codes, like the app's share screen.
  useEffect(() => {
    if (!made || made.codes.length < 2) return
    const id = window.setInterval(() => setPart((p) => (p + 1) % made.codes.length), 900)
    return () => window.clearInterval(id)
  }, [made])

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  const download = () => {
    if (!made) return
    const url = URL.createObjectURL(new Blob([made.payload], { type: 'application/x-charades' }))
    const a = document.createElement('a')
    a.href = url
    a.download = deckFileName(made.deck)
    a.click()
    URL.revokeObjectURL(url)
  }

  const deck = made?.deck
  const fg = deck ? textOn(deck.accentColor) : '#fff'

  return (
    <div>
      <div className="rounded-[28px] border border-[var(--cr-line)] bg-[var(--cr-surface)] p-3 sm:p-4">
        <label htmlFor="deck-input" className="sr-only">
          Deck JSON from your AI
        </label>
        <textarea
          id="deck-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={EXAMPLE}
          spellCheck={false}
          rows={12}
          className="cr-code w-full resize-y rounded-2xl bg-black/40 p-4 text-white/85 outline-none placeholder:text-white/25 focus:ring-2 focus:ring-[var(--cr-blue)]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy || !input.trim()} onClick={() => make(input)} className="cr-btn cr-btn-primary disabled:opacity-40">
            <Wand2 size={18} aria-hidden />
            Make my deck
          </button>
          <button type="button" onClick={() => setInput(EXAMPLE)} className="cr-btn cr-btn-glass">
            Try the example
          </button>
          <span className="ml-auto text-xs text-white/40">Runs in your browser. Nothing is uploaded.</span>
        </div>
      </div>

      {errors.length > 0 ? (
        <div role="alert" className="mt-4 rounded-2xl border border-[var(--cr-red)]/40 bg-[var(--cr-red)]/10 p-4 text-sm">
          {errors.map((e, i) => (
            <p key={i} className="flex gap-2 text-white/85">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--cr-red)]" aria-hidden />
              {e.message}
            </p>
          ))}
        </div>
      ) : null}

      {made && deck ? (
        <div id="made" className="mt-8 grid scroll-mt-28 gap-6 md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col self-start rounded-[28px] p-6" style={{ background: deck.accentColor, color: fg, boxShadow: '0 0 0 4px #0A0A0D, 0 0 0 9px #fff' }}>
            <span className="text-5xl">{deck.emoji ?? '🃏'}</span>
            <h3 className="cr-display mt-4 text-4xl leading-none tracking-[-0.03em]">{deck.name}</h3>
            {deck.description ? <p className="mt-2 text-sm opacity-80">{deck.description}</p> : null}
            <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.16em] opacity-70">
              {deck.cards.length} cards{deck.cards.some((c) => c.taboo) ? ' · banned words' : ''}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {deck.cards.slice(0, 12).map((c) => (
                <span key={c.id} className="cr-display rounded-xl bg-white px-3 py-1.5 text-sm text-[#0A0A0D]">
                  {c.text}
                </span>
              ))}
              {deck.cards.length > 12 ? (
                <span className="rounded-xl bg-black/20 px-3 py-1.5 text-sm font-bold">+{deck.cards.length - 12} more</span>
              ) : null}
            </div>
            {made.warnings.length > 0 ? (
              <ul className="mt-5 space-y-1 rounded-2xl bg-black/25 p-3 text-xs text-white">
                {made.warnings.slice(0, 5).map((w, i) => (
                  <li key={i}>⚠️ {w.message}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col items-center rounded-[28px] border border-[var(--cr-line)] bg-[var(--cr-surface)] p-6 text-center">
            {made.codes.length > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- a data URL generated on the spot */}
                <img
                  src={made.codes[part % made.codes.length]}
                  alt={`QR code for ${deck.name}${made.codes.length > 1 ? `, part ${part + 1} of ${made.codes.length}` : ''}`}
                  className="aspect-square w-full max-w-[280px] rounded-2xl"
                />
                <p className="mt-4 text-sm text-white/65">
                  {made.codes.length > 1
                    ? `Big deck: ${made.codes.length} codes. In Charades, go to Decks → Import → Scan and hold the phone here until it has them all.`
                    : 'Scan with the iPhone camera to open it in Charades, or use Import → Scan in the app.'}
                </p>
                {made.codes.length > 1 ? (
                  <div className="mt-3 flex gap-1.5" aria-hidden>
                    {made.codes.map((_, i) => (
                      <span key={i} className={`h-1.5 w-5 rounded-full ${i === part ? 'bg-[var(--cr-yellow)]' : 'bg-white/15'}`} />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-white/65">This deck is too big for codes. Download the file and AirDrop or message it to your phone.</p>
            )}

            <div className="mt-6 grid w-full gap-2">
              <button type="button" onClick={download} className="cr-btn cr-btn-primary w-full">
                <Download size={18} aria-hidden />
                Download {deckFileName(deck)}
              </button>
              {made.payload.length <= QR_PAYLOAD_LIMIT ? (
                <a href={LINK_PREFIX + made.payload} className="cr-btn cr-btn-glass w-full">
                  <Smartphone size={18} aria-hidden />
                  Open in Charades (on iPhone)
                </a>
              ) : null}
              <button type="button" onClick={() => copy('link', window.location.href)} className="cr-btn cr-btn-glass w-full">
                {copied === 'link' ? <Check size={18} aria-hidden /> : <Link2 size={18} aria-hidden />}
                {copied === 'link' ? 'Copied' : 'Copy a link to this deck'}
              </button>
              <button type="button" onClick={() => copy('json', JSON.stringify(deck, null, 2))} className="text-xs text-white/40 underline-offset-4 hover:text-white hover:underline">
                {copied === 'json' ? 'Copied' : (
                  <span className="inline-flex items-center gap-1">
                    <Copy size={12} aria-hidden /> Copy the full deck JSON
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
