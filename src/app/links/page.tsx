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
import { VerticalImageStack } from '@/components/ui/vertical-image-stack'

export default function LinksPage() {
  const socialIcons: DockIcon[] = [
    {
      alt: "GitHub",
      href: "https://github.com/byw1",
      icon: <GithubIcon />,
    },
    {
      alt: "Twitter",
      href: "https://twitter.com",
      icon: <TwitterIcon />,
    },
    {
      alt: "Instagram",
      href: "https://instagram.com",
      icon: <InstagramIcon />,
    },
    {
      alt: "LinkedIn",
      href: "https://linkedin.com",
      icon: <LinkedinIcon />,
    },
    {
      alt: "YouTube",
      href: "https://youtube.com",
      icon: <YoutubeIcon />,
    },
    {
      alt: "Email",
      href: "mailto:hello@bywilliaml.com",
      icon: <MailIcon />,
    },
  ]

  return (
    <main className="relative min-h-screen w-full select-none bg-black">
      <GlassFilter />
      <VerticalImageStack />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <GlassDock icons={socialIcons} />
      </div>
    </main>
  )
}
