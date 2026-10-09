import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google'
import { Footer, Nav } from '@/components/charades/chrome'
import './charades.css'

// The app's two faces: Bricolage for anything shouted, Plus Jakarta for reading.
const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['800'], variable: '--font-display' })
const body = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-body' })

export const metadata: Metadata = {
  metadataBase: new URL('https://bywilliaml.com'),
  title: {
    default: 'Charades: Make Your Own Decks',
    template: '%s · Charades',
  },
  description:
    'A forehead-card party game. Make decks about your own friends and share them with a QR code. Free, offline, no ads, no accounts.',
  icons: { icon: '/charades/icon.png', apple: '/charades/icon.png' },
  openGraph: {
    title: 'Charades: Make Your Own Decks',
    description: 'Phone on your forehead. Friends yell clues. Free, offline, no ads, no accounts.',
    images: [{ url: '/charades/icon.png', width: 1024, height: 1024 }],
    type: 'website',
  },
  twitter: { card: 'summary' },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0D',
}

export default function CharadesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`charades ${display.variable} ${body.variable}`}>
      <Nav />
      {children}
      <Footer />
    </div>
  )
}
