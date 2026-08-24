import type { Metadata } from 'next'

// The page is a client component, so per-route metadata lives here in the
// segment layout — a server module regardless of what its page does.
export const metadata: Metadata = {
  title: 'Blackjack — William Lee',
  description: 'A little blackjack while the projects page is under construction.',
}

export default function BlackjackLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
