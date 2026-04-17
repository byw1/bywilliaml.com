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
import { User, Code, Play, PenLine } from 'lucide-react'

const linkCards: CardItem[] = [
  {
    id: 1,
    label: "About Me",
    href: "/about",
    description: "who i am and what i do",
    bookClassName: "bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white",
    icon: <User className="size-5 text-white/60" />,
  },
  {
    id: 2,
    label: "Projects",
    href: "https://github.com/byw1",
    description: "things i've built",
    bookClassName: "bg-gradient-to-br from-[#0d1117] to-[#161b22] text-white",
    icon: <Code className="size-5 text-white/60" />,
  },
  {
    id: 3,
    label: "YouTube",
    href: "https://youtube.com",
    description: "videos and content",
    bookClassName: "bg-gradient-to-br from-[#1a0000] to-[#330000] text-white",
    icon: <Play className="size-5 text-white/60" />,
  },
  {
    id: 4,
    label: "Blog",
    href: "https://bywilliaml.substack.com/archive",
    description: "thoughts and writing",
    bookClassName: "bg-gradient-to-br from-[#0a1a0a] to-[#1a2f1a] text-white",
    icon: <PenLine className="size-5 text-white/60" />,
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
          statusText="currently gooning"
        />
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <MacOSDock apps={socialApps} onAppClick={handleAppClick} />
      </div>
    </main>
  )
}
