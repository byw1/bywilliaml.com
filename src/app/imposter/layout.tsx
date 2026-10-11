import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google'
import { Footer, Nav } from '@/components/imposter/chrome'
import './imposter.css'

// The same two faces as Charades: Bricolage for anything said out loud, Plus Jakarta for reading.
const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['800'], variable: '--font-display' })
const body = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-body' })

export const metadata: Metadata = {
  metadataBase: new URL('https://bywilliaml.com'),
  title: {
    default: 'Imposter: The Hidden-Word Party Game',
    template: '%s · Imposter',
  },
  description:
    'Everyone knows the secret word, except one of you. Pass one phone round the table, give one-word clues and vote. Free, offline, no ads, no accounts.',
  icons: { icon: '/imposter/icon.png', apple: '/imposter/icon.png' },
  openGraph: {
    title: 'Imposter: The Hidden-Word Party Game',
    description: 'Everyone knows the secret word, except one of you. Free, offline, no ads, no accounts.',
    images: [{ url: '/imposter/icon.png', width: 1024, height: 1024 }],
    type: 'website',
  },
  twitter: { card: 'summary' },
}

export const viewport: Viewport = {
  themeColor: '#0C0A10',
}

export default function ImposterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`imposter ${display.variable} ${body.variable}`}>
      <Nav />
      {children}
      <Footer />
    </div>
  )
}
