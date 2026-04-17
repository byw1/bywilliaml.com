'use client'

import { GlassDock, GlassFilter } from '@/components/ui/liquid-glass'
import type { DockIcon } from '@/components/ui/liquid-glass'
import {
  GithubIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
  MailIcon,
} from '@/components/ui/social-icons'
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

export default function LinksPage() {
  const socialIcons: DockIcon[] = [
    { alt: "GitHub", href: "https://github.com/byw1", icon: <GithubIcon /> },
    { alt: "Twitter", href: "https://twitter.com", icon: <TwitterIcon /> },
    { alt: "Instagram", href: "https://instagram.com", icon: <InstagramIcon /> },
    { alt: "LinkedIn", href: "https://linkedin.com", icon: <LinkedinIcon /> },
    { alt: "YouTube", href: "https://youtube.com", icon: <YoutubeIcon /> },
    { alt: "Email", href: "mailto:hello@bywilliaml.com", icon: <MailIcon /> },
  ]

  return (
    <main className="relative min-h-screen w-full select-none bg-black">
      <GlassFilter />
      <VerticalImageStack cards={linkCards} />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <GlassDock icons={socialIcons} />
      </div>
    </main>
  )
}
