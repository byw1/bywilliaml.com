'use client'

import React from 'react'
import {
  GithubIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
  MailIcon,
} from './social-icons'

interface AppIconTileProps {
  background: string
  children: React.ReactNode
  iconScale?: number
}

const AppIconTile: React.FC<AppIconTileProps> = ({
  background,
  children,
  iconScale = 0.55,
}) => (
  <div
    className="relative w-full h-full flex items-center justify-center overflow-hidden"
    style={{
      background,
      borderRadius: '22%',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.2)',
    }}
  >
    <div
      className="flex items-center justify-center text-white [&_svg]:w-full [&_svg]:h-full"
      style={{ width: `${iconScale * 100}%`, height: `${iconScale * 100}%` }}
    >
      {children}
    </div>
  </div>
)

export const GithubAppIcon = () => (
  <AppIconTile background="linear-gradient(180deg, #2b2b2b 0%, #0d0d0d 100%)">
    <GithubIcon />
  </AppIconTile>
)

export const TwitterAppIcon = () => (
  <AppIconTile background="#000000" iconScale={0.5}>
    <TwitterIcon />
  </AppIconTile>
)

export const InstagramAppIcon = () => (
  <AppIconTile
    background="radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)"
  >
    <InstagramIcon />
  </AppIconTile>
)

export const LinkedinAppIcon = () => (
  <AppIconTile background="linear-gradient(180deg, #0A8DE6 0%, #0A66C2 100%)">
    <LinkedinIcon />
  </AppIconTile>
)

export const YoutubeAppIcon = () => (
  <AppIconTile background="#ffffff" iconScale={0.7}>
    <div className="text-[#FF0000] w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full">
      <YoutubeIcon />
    </div>
  </AppIconTile>
)

export const MailAppIcon = () => (
  <AppIconTile background="linear-gradient(180deg, #1fc5fd 0%, #0a9bf5 100%)">
    <MailIcon />
  </AppIconTile>
)
