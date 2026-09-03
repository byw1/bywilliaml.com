import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'YouTube Channels — William Lee',
  description: 'Channels I watch and recommend.',
}

export default function YoutubeChannelsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
