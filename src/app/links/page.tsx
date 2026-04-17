'use client'

import { GlassFilter } from '@/components/ui/liquid-glass'
import { MacOSDock, type DockItem } from '@/components/ui/mac-os-dock'
import {
  GithubAppIcon,
  TwitterAppIcon,
  InstagramAppIcon,
  LinkedinAppIcon,
  YoutubeAppIcon,
  MailAppIcon,
} from '@/components/ui/social-app-icons'
import { VerticalImageStack, type CardItem } from '@/components/ui/vertical-image-stack'

const linkCards: CardItem[] = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600&auto=format&fit=crop",
    alt: "Mountain peaks at sunrise",
    label: "About Me",
    href: "/about",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1600&auto=format&fit=crop",
    alt: "Laptop with code on screen",
    label: "Projects",
    href: "https://github.com/byw1",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1600&auto=format&fit=crop",
    alt: "Cinema camera filming",
    label: "YouTube",
    href: "https://youtube.com",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
    alt: "Mountains under starry sky",
    label: "Blog",
    href: "https://bywilliaml.substack.com/archive",
  },
]

const socialDockItems: DockItem[] = [
  { id: "github", name: "GitHub", href: "https://github.com/byw1", icon: <GithubAppIcon /> },
  { id: "twitter", name: "X", href: "https://twitter.com", icon: <TwitterAppIcon /> },
  { id: "instagram", name: "Instagram", href: "https://instagram.com", icon: <InstagramAppIcon /> },
  { id: "linkedin", name: "LinkedIn", href: "https://linkedin.com", icon: <LinkedinAppIcon /> },
  { id: "youtube", name: "YouTube", href: "https://youtube.com", icon: <YoutubeAppIcon /> },
  { id: "email", name: "Email", href: "mailto:hello@bywilliaml.com", icon: <MailAppIcon /> },
]

export default function LinksPage() {
  return (
    <main className="relative min-h-screen w-full select-none bg-black">
      <GlassFilter />
      <VerticalImageStack cards={linkCards} />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <MacOSDock items={socialDockItems} />
      </div>
    </main>
  )
}
