import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects — William L',
  description: "Side projects I'm building.",
}

export default function ProjectsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
