import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Videogames — William Lee',
  description: "What I play when I'm not building.",
}

export default function VideogamesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
