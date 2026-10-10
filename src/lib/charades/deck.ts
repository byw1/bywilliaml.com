/**
 * Charades deck format, for the web deck maker.
 *
 * Mirrors the app's own rules (byw1/charades: src/decks/types.ts, validate.ts
 * and share.ts) so a deck made here imports cleanly on the phone. Everything
 * runs in the browser: nothing typed into the deck maker is sent anywhere.
 *
 * The input is forgiving on purpose, because it is usually whatever an AI
 * chat produced: a bare list of cards, a full deck file, JSON wrapped in a
 * code fence, `banned` or `taboo`, `hint` or `note`. The output is strict.
 */

export const SCHEMA_VERSION = 1
export const PAYLOAD_PREFIX = 'D1.'
export const LINK_PREFIX = 'charades://deck?d='
/** The app's single-code limit; bigger decks go out as a flip of codes. */
export const QR_PAYLOAD_LIMIT = 2100
export const QR_PART_LIMIT = 1200
export const MAX_QR_PARTS = 12

export const LIMITS = {
  name: 60,
  description: 280,
  author: 40,
  tags: 10,
  tag: 24,
  note: 140,
  cards: 2000,
  cardSoft: 60,
  banned: 5,
  bannedWord: 32,
  emoji: 16,
  minPlayable: 10,
} as const

/** The app's deck colours. Green and orange are left out: they are the flashes. */
export const DECK_COLORS = [
  '#FF3D8B',
  '#9B5CFF',
  '#2EA8FF',
  '#00C2B2',
  '#FF3B47',
  '#FFE500',
  '#5B5BFF',
  '#E040FB',
] as const

const NAMED_COLORS: Record<string, string> = {
  pink: '#FF3D8B',
  purple: '#9B5CFF',
  blue: '#2EA8FF',
  teal: '#00C2B2',
  red: '#FF3B47',
  yellow: '#FFE500',
  indigo: '#5B5BFF',
  violet: '#5B5BFF',
  magenta: '#E040FB',
}

export type Card = { id: string; text: string; note: string | null; taboo?: string[] }

export type Deck = {
  schemaVersion: number
  id: string
  name: string
  description: string
  author: string
  language: string
  accentColor: string
  emoji?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  cards: Card[]
}

export type Issue = { path: string; message: string }

export type BuildResult =
  | { ok: true; deck: Deck; warnings: Issue[] }
  | { ok: false; errors: Issue[]; warnings: Issue[] }

type Random = () => number

function hex8(random: Random): string {
  return Math.floor(random() * 0x100000000)
    .toString(16)
    .padStart(8, '0')
    .slice(0, 8)
}

const DECK_ID = /^dck_[0-9a-f]{8}$/
const CARD_ID = /^crd_[0-9a-f]{8}$/
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Trims, drops blanks and de-duplicates case-insensitively, like the app. */
function cleanWords(words: unknown[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of words) {
    const word = text(raw)
    const key = word.toLocaleLowerCase()
    if (!word || seen.has(key)) continue
    seen.add(key)
    out.push(word)
  }
  return out
}

function pickColor(value: unknown, name: string): string {
  const raw = text(value)
  if (HEX.test(raw)) {
    const short = raw.length === 4
    return short ? `#${[...raw.slice(1)].map((c) => c + c).join('')}`.toUpperCase() : raw.toUpperCase()
  }
  const named = NAMED_COLORS[raw.toLowerCase()]
  if (named) return named
  // A stable pick from the deck name, so the same deck keeps its colour.
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0
  return DECK_COLORS[hash % DECK_COLORS.length]
}

/**
 * Pulls a JSON value out of whatever was pasted: a code fence, a chat reply
 * with prose around it, or the bare thing.
 */
export function extractJson(input: string): unknown {
  const trimmed = input.trim()
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed)
  const candidates = [fenced?.[1], trimmed]
  const firstBrace = trimmed.search(/[[{]/)
  if (firstBrace >= 0) {
    const close = trimmed[firstBrace] === '{' ? '}' : ']'
    const lastBrace = trimmed.lastIndexOf(close)
    if (lastBrace > firstBrace) candidates.push(trimmed.slice(firstBrace, lastBrace + 1))
  }
  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      return JSON.parse(candidate)
    } catch {
      // try the next shape
    }
  }
  throw new Error('No deck found. Paste the JSON your AI gave you, code fences and all.')
}

/**
 * JSON if there is any, otherwise one card per line: a plain list typed or
 * pasted from notes is a deck too.
 */
export function parseLoose(input: string): unknown {
  try {
    return extractJson(input)
  } catch (error) {
    const lines = input
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
      .filter(Boolean)
    if (lines.length >= 2 && !/[{}]/.test(input)) return { cards: lines }
    throw error
  }
}

/**
 * Turns loose input into a deck the app accepts, or explains what is wrong
 * in words meant for the person pasting it.
 */
export function buildDeck(input: unknown, options: { random?: Random; now?: Date } = {}): BuildResult {
  const random = options.random ?? Math.random
  const now = (options.now ?? new Date()).toISOString().replace(/\.\d{3}Z$/, 'Z')
  const errors: Issue[] = []
  const warnings: Issue[] = []

  // A bare list of cards is a deck that has not been named yet.
  const source: Record<string, unknown> = Array.isArray(input) ? { cards: input } : isRecord(input) ? input : {}
  if (!Array.isArray(input) && !isRecord(input)) {
    return { ok: false, errors: [{ path: '', message: 'That is not a deck. It needs a name and a list of cards.' }], warnings }
  }

  let name = text(source.name ?? source.title)
  if (!name) {
    name = 'My deck'
    warnings.push({ path: 'name', message: 'No name given, so it is called “My deck”. Rename it in the app.' })
  } else if (name.length > LIMITS.name) {
    errors.push({ path: 'name', message: `Deck names are limited to ${LIMITS.name} characters.` })
  }

  const description = text(source.description)
  if (description.length > LIMITS.description) {
    errors.push({ path: 'description', message: `Descriptions are limited to ${LIMITS.description} characters.` })
  }

  const author = text(source.author)
  if (author.length > LIMITS.author) {
    errors.push({ path: 'author', message: `Author names are limited to ${LIMITS.author} characters.` })
  }

  const emojiRaw = text(source.emoji)
  const emoji = emojiRaw && emojiRaw.length <= LIMITS.emoji && PICTOGRAPHIC.test(emojiRaw) ? emojiRaw : undefined
  if (emojiRaw && !emoji) warnings.push({ path: 'emoji', message: 'The cover emoji could not be read, so the deck uses the default.' })

  const tags = Array.isArray(source.tags) ? cleanWords(source.tags).slice(0, LIMITS.tags).map((t) => t.slice(0, LIMITS.tag)) : []

  const rawCards = Array.isArray(source.cards) ? source.cards : null
  if (!rawCards) {
    errors.push({ path: 'cards', message: 'There is no list of cards. Add "cards": ["…", "…"].' })
  } else if (rawCards.length > LIMITS.cards) {
    errors.push({ path: 'cards', message: `Decks are limited to ${LIMITS.cards} cards. This one has ${rawCards.length}.` })
  }

  const cards: Card[] = []
  const seenIds = new Set<string>()
  const seenText = new Set<string>()
  for (const [index, raw] of (rawCards ?? []).entries()) {
    const path = `cards[${index}]`
    const record = typeof raw === 'string' ? { text: raw } : isRecord(raw) ? raw : null
    if (!record) {
      errors.push({ path, message: `Card ${index + 1} is not a card.` })
      continue
    }

    const cardText = text(record.text ?? record.word ?? record.answer)
    if (!cardText) {
      errors.push({ path, message: `Card ${index + 1} is empty.` })
      continue
    }
    const key = cardText.toLocaleLowerCase()
    if (seenText.has(key)) {
      warnings.push({ path, message: `“${cardText}” is in the deck twice, so the copy was dropped.` })
      continue
    }
    seenText.add(key)
    if (cardText.length > LIMITS.cardSoft) {
      warnings.push({ path, message: `“${cardText.slice(0, 30)}…” is long. Anything over ${LIMITS.cardSoft} characters is hard to read at arm’s length.` })
    }

    const noteRaw = text(record.note ?? record.hint)
    const note = noteRaw ? noteRaw.slice(0, LIMITS.note) : null
    if (noteRaw.length > LIMITS.note) warnings.push({ path, message: `The hint on card ${index + 1} was cut to ${LIMITS.note} characters.` })

    const bannedRaw = record.taboo ?? record.banned ?? record.bannedWords
    let taboo: string[] = []
    if (Array.isArray(bannedRaw)) {
      taboo = cleanWords(bannedRaw).filter((w) => w.length <= LIMITS.bannedWord)
      if (taboo.length > LIMITS.banned) {
        warnings.push({ path, message: `Card ${index + 1} had more than ${LIMITS.banned} banned words; the first ${LIMITS.banned} were kept.` })
        taboo = taboo.slice(0, LIMITS.banned)
      }
    }

    let id = text(record.id)
    while (!CARD_ID.test(id) || seenIds.has(id)) id = `crd_${hex8(random)}`
    seenIds.add(id)

    const card: Card = { id, text: cardText, note }
    if (taboo.length > 0) card.taboo = taboo
    cards.push(card)
  }

  if (errors.length > 0) return { ok: false, errors, warnings }

  if (cards.length < LIMITS.minPlayable) {
    warnings.push({ path: 'cards', message: `This deck has ${cards.length} ${cards.length === 1 ? 'card' : 'cards'}. It needs ${LIMITS.minPlayable} to start a round.` })
  }

  const givenId = text(source.id)
  const deck: Deck = {
    schemaVersion: SCHEMA_VERSION,
    id: DECK_ID.test(givenId) ? givenId : `dck_${hex8(random)}`,
    name,
    description,
    author,
    language: 'en',
    accentColor: pickColor(source.accentColor ?? source.color, name),
    tags,
    createdAt: now,
    updatedAt: now,
    cards,
  }
  if (emoji) deck.emoji = emoji

  return { ok: true, deck, warnings }
}

// --- Payloads: D1.<base64url(zlib(json))>, exactly as the app writes them ---

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export function encodeBase64Url(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]
    const b = bytes[i + 1]
    const c = bytes[i + 2]
    out += ALPHABET[a >> 2]
    out += ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)]
    if (b === undefined) break
    out += ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)]
    if (c === undefined) break
    out += ALPHABET[c & 63]
  }
  return out
}

export function decodeBase64Url(input: string): Uint8Array | null {
  const clean = input.trim().replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  if (clean.length % 4 === 1) return null
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4))
  let position = 0
  let buffer = 0
  let bits = 0
  for (const ch of clean) {
    const value = ALPHABET.indexOf(ch)
    if (value < 0) return null
    buffer = (buffer << 6) | value
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes[position++] = (buffer >> bits) & 0xff
    }
  }
  return bytes
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const response = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream))
  return new Uint8Array(await response.arrayBuffer())
}

/** `deflate` in the Compression Streams API is zlib, which is what pako inflates. */
export async function encodeDeck(deck: Deck): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(deck))
  return PAYLOAD_PREFIX + encodeBase64Url(await pipe(json, new CompressionStream('deflate')))
}

/** Reads a payload or a charades:// link back into whatever deck it carries. */
export async function decodePayload(input: string): Promise<unknown> {
  const fromLink = /[?&]d=([A-Za-z0-9\-_+/=%.]+)/.exec(input)
  const payload = fromLink ? decodeURIComponent(fromLink[1]) : input.trim()
  const match = /^D1\.([A-Za-z0-9\-_+/=]+)$/.exec(payload)
  if (!match) throw new Error('That code is not a Charades deck.')
  const bytes = decodeBase64Url(match[1])
  if (!bytes) throw new Error('That deck code is damaged.')
  const json = new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate')))
  return JSON.parse(json)
}

export function isPayload(input: string): boolean {
  return /(?:^|[?&]d=)D1\.[A-Za-z0-9\-_+/=]{8,}/.test(input.trim())
}

/** A short tag for a payload, so the app never mixes pieces of two decks. */
function payloadTag(payload: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

/** `DQ1.<tag>.<n>.<of>.<piece>`: the app collects these in any order. */
export function splitForQr(payload: string, limit = QR_PART_LIMIT): string[] {
  const tag = payloadTag(payload)
  const size = Math.max(1, limit - (3 + tag.length + 10))
  const total = Math.max(1, Math.ceil(payload.length / size))
  return Array.from({ length: total }, (_, i) => `DQ1.${tag}.${i + 1}.${total}.${payload.slice(i * size, (i + 1) * size)}`)
}

/** A filename safe on every platform, like the app's. */
export function deckFileName(deck: Pick<Deck, 'name'>): string {
  const base =
    deck.name
      .trim()
      .replace(/[^\p{L}\p{N} _-]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40) || 'deck'
  return `${base}.charades`
}
