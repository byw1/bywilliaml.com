import type { Metadata } from 'next'
import { ShadeSticker } from '@/components/imposter/shade-sticker'
import { GITHUB_URL, ISSUES_URL } from '@/components/imposter/data'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Imposter collects nothing. No accounts, no analytics, no ads, no tracking, no servers, no permissions.',
  alternates: { canonical: '/imposter/privacy' },
}

const UPDATED = '11 October 2026'

const AT_A_GLANCE = [
  ['Data collected', 'None'],
  ['Accounts', 'None'],
  ['Analytics & ads', 'None'],
  ['Tracking', 'None'],
  ['Permissions', 'None'],
  ['Works offline', 'Always'],
]

/**
 * The App Store privacy policy for Imposter. Kept in step with PRIVACY.md in
 * byw1/imposter; change both together.
 */
export default function ImposterPrivacyPage() {
  return (
    <main className="px-4 pb-24 pt-32 sm:px-6">
      <article className="mx-auto max-w-2xl">
        <div className="flex items-center gap-4">
          <ShadeSticker size={72} mood="wink" glyph="🔒" bounce />
          <div>
            <p className="im-kicker">Imposter</p>
            <h1 className="im-display text-[clamp(2.4rem,7vw,3.6rem)] leading-none tracking-[-0.035em]">Privacy Policy</h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/45">Last updated {UPDATED}</p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AT_A_GLANCE.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--im-line)] bg-[var(--im-surface)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
              <p className="im-display mt-1 text-2xl text-[var(--im-lime)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="im-prose mt-6">
          <p>
            Imposter is a party game that works entirely on your phone. This policy is short because there is
            very little to say.
          </p>

          <h2>What we collect</h2>
          <p>
            <strong>Nothing.</strong> Imposter has no accounts, no analytics, no advertising, no tracking and no
            servers. It never sends anything about you or your games anywhere. The app does not use the
            internet at all, and its code includes a test that fails the build if anything tries to.
          </p>

          <h2>What stays on your phone</h2>
          <p>
            The names of the people you play with, your house rules, the topics you make, the game in progress
            and the stats from past rounds are stored on your device only. Nobody else, including us, can see
            them. Deleting the app deletes them, and Settings has a button to clear the stats.
          </p>

          <h2>Permissions</h2>
          <p>
            None. Imposter doesn&apos;t ask for the camera, microphone, photos, contacts, location or
            notifications.
          </p>

          <h2>Third parties</h2>
          <p>
            Imposter contains no third-party analytics, advertising or tracking SDKs, and shares no data with
            anyone, because it has none to share. Apple handles App Store downloads under its own privacy
            policy.
          </p>

          <h2>Children</h2>
          <p>Imposter collects no data from anyone, including children.</p>

          <h2>This website</h2>
          <p>
            The demo round on this site runs entirely in your browser and sends nothing anywhere. Like any
            website, the server hosting these pages may keep standard request logs.
          </p>

          <h2>Changes</h2>
          <p>If this ever changes, this page will say so before the app does.</p>

          <h2>Contact</h2>
          <p>
            Questions: open an issue at <a href={ISSUES_URL}>github.com/byw1/imposter/issues</a>. The app&apos;s
            source code is public at <a href={GITHUB_URL}>github.com/byw1/imposter</a>, so anyone can check all
            of the above.
          </p>
        </div>
      </article>
    </main>
  )
}
