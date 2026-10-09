import type { Metadata } from 'next'
import Link from 'next/link'
import { DexSticker } from '@/components/charades/dex-sticker'
import { GITHUB_URL, ISSUES_URL } from '@/components/charades/data'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Charades collects nothing. No accounts, no analytics, no ads, no tracking, no servers.',
  alternates: { canonical: '/charades/privacy' },
}

const UPDATED = '9 October 2026'

const AT_A_GLANCE = [
  ['Data collected', 'None'],
  ['Accounts', 'None'],
  ['Analytics & ads', 'None'],
  ['Tracking', 'None'],
  ['Servers', 'None'],
  ['Works offline', 'Always'],
]

/**
 * The App Store privacy policy for Charades: Make Your Own Decks. Kept in
 * step with PRIVACY.md in byw1/Deckhead; change both together.
 */
export default function CharadesPrivacyPage() {
  return (
    <main className="px-4 pb-24 pt-32 sm:px-6">
      <article className="mx-auto max-w-2xl">
        <div className="flex items-center gap-4">
          <DexSticker size={72} mood="wow" glyph="🔒" bounce />
          <div>
            <p className="cr-kicker">Charades: Make Your Own Decks</p>
            <h1 className="cr-display text-[clamp(2.4rem,7vw,3.6rem)] leading-none tracking-[-0.035em]">Privacy Policy</h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/45">Last updated {UPDATED}</p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AT_A_GLANCE.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--cr-line)] bg-[var(--cr-surface)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
              <p className="cr-display mt-1 text-2xl text-[var(--cr-green)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="cr-prose mt-6">
          <p>
            Charades is a party game that works entirely on your phone. This policy is short because there is
            very little to say.
          </p>

          <h2>What we collect</h2>
          <p>
            <strong>Nothing.</strong> Charades has no accounts, no analytics, no advertising, no tracking and no
            servers. It never sends anything about you or your games anywhere. The app does not use the
            internet at all, and its code includes a test that fails the build if anything tries to.
          </p>

          <h2>What stays on your phone</h2>
          <p>
            The decks you make (including any photos you add to cards), your games, your scores and streak,
            and your settings are stored on your device only. Nobody else, including us, can see them.
            Deleting the app deletes them.
          </p>

          <h2>Sharing a deck</h2>
          <p>
            When you share a deck, the whole deck is packed into the QR code, link or file itself. It goes only
            where you send it, straight to the person you share it with, and never passes through anyone
            else&apos;s server. Photos on cards travel only in files, never in codes or links.
          </p>

          <h2>Permissions</h2>
          <ul>
            <li>
              <strong>Camera</strong>: to scan a deck&apos;s QR code and to take a photo for a card.
            </li>
            <li>
              <strong>Photos</strong>: you pick photos for your cards with Apple&apos;s own picker, which hands
              Charades only the photos you choose.
            </li>
            <li>
              <strong>Motion</strong>: for the tilt controls, to tell when you tip the phone to answer. Nothing
              is recorded.
            </li>
          </ul>
          <p>Charades never asks for the microphone, notifications, contacts or your location.</p>

          <h2>Third parties</h2>
          <p>
            Charades contains no third-party analytics, advertising or tracking SDKs, and shares no data with
            anyone, because it has none to share. Apple handles App Store downloads and purchases under its own
            privacy policy.
          </p>

          <h2>Children</h2>
          <p>Charades collects no data from anyone, including children.</p>

          <h2>This website and the deck maker</h2>
          <p>
            The <Link href="/charades/decks">deck maker</Link>{' '}on this site runs entirely in your browser: the
            cards you paste are turned into a code on your own device and are not uploaded. Like any website,
            the server hosting these pages may keep standard request logs. The optional Claude skill runs
            inside your own Claude account, under Anthropic&apos;s terms; nothing from it reaches us.
          </p>

          <h2>Changes</h2>
          <p>If this ever changes, this page will say so before the app does.</p>

          <h2>Contact</h2>
          <p>
            Questions: open an issue at <a href={ISSUES_URL}>github.com/byw1/Deckhead/issues</a>. The app&apos;s
            source code is public at <a href={GITHUB_URL}>github.com/byw1/Deckhead</a>, so anyone can check
            all of the above.
          </p>
        </div>
      </article>
    </main>
  )
}
