import type { Metadata } from 'next'

// A route segment's layout is a server module even when its page is a client
// component, so this is where per-page metadata has to live.
export const metadata: Metadata = {
  title: 'Projects — William Lee',
  description: "Things I'm building.",
  // Test page: keep it out of search results until it replaces the real one.
  robots: { index: false, follow: false },
}

export default function ProjectsTestLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
