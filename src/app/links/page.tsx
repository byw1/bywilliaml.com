'use client'

import { GlassFilter } from '@/components/ui/liquid-glass'
import MacOSDock, { type DockApp } from '@/components/ui/mac-os-dock'
import ProfileCard from '@/components/ui/profile-card'
import {
  GithubAppIcon,
  TwitterAppIcon,
  InstagramAppIcon,
  LinkedinAppIcon,
  YoutubeAppIcon,
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

const socialApps: DockApp[] = [
  { id: "github", name: "GitHub", icon: <GithubAppIcon /> },
  { id: "twitter", name: "X", icon: <TwitterAppIcon /> },
  { id: "instagram", name: "Instagram", icon: <InstagramAppIcon /> },
  { id: "linkedin", name: "LinkedIn", icon: <LinkedinAppIcon /> },
  { id: "youtube", name: "YouTube", icon: <YoutubeAppIcon /> },
]

const socialHrefs: Record<string, string> = {
  github: "https://github.com/byw1",
  twitter: "https://twitter.com",
  instagram: "https://instagram.com",
  linkedin: "https://linkedin.com",
  youtube: "https://youtube.com",
}

export default function LinksPage() {
  const handleAppClick = (appId: string) => {
    const href = socialHrefs[appId]
    if (!href) return
    if (href.startsWith('http') || href.startsWith('mailto:')) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = href
    }
  }

  return (
    <main className="relative min-h-screen w-full select-none bg-black">
      <GlassFilter />
      <VerticalImageStack cards={linkCards} />

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[340px]">
        <ProfileCard
          name="William Lee"
          role="@bywilliaml"
          avatarSrc="https://avatars.githubusercontent.com/byw1"
          statusText="Available for work"
        />
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <MacOSDock apps={socialApps} onAppClick={handleAppClick} />
      </div>
    </main>
  )
}
