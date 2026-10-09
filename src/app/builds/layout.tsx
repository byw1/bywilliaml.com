import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Builds — William L',
  description: "Side projects I'm building.",
}

export default function BuildsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
