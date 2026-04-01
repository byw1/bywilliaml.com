'use client'

import { useState, useEffect } from 'react'
import { GlassDock, GlassButton, GlassFilter } from '@/components/ui/liquid-glass'
import type { DockIcon } from '@/components/ui/liquid-glass'
import {
  GithubIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
  MailIcon,
} from '@/components/ui/social-icons'

export default function LinksPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

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
    <div
      className="min-h-screen h-full flex items-center justify-center font-light relative overflow-hidden w-full"
      style={{
        background: `url("https://images.unsplash.com/photo-1432251407527-504a6b4174a2?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0") center center`,
        backgroundSize: 'cover',
        animation: "moveBackground 60s linear infinite",
      }}
    >
      <GlassFilter />

      <div
        className={`flex flex-col gap-6 items-center justify-center w-full max-w-md px-6 transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg tracking-tight">
            William L
          </h1>
          <p className="text-white/70 text-lg font-light tracking-wide">
            Developer & Creator
          </p>
        </div>

        {/* Link Buttons */}
        <div className="flex flex-col gap-4 w-full items-center">
          <GlassButton href="/about">
            <div className="text-lg text-white whitespace-nowrap">
              About Me
            </div>
          </GlassButton>

          <GlassButton href="https://bywilliaml.substack.com/archive">
            <div className="text-lg text-white whitespace-nowrap">
              Substack Archive
            </div>
          </GlassButton>
        </div>

        {/* Social Icons Dock */}
        <div className="mt-8">
          <GlassDock icons={socialIcons} />
        </div>
      </div>
    </div>
  )
}
