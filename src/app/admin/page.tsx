'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const STORAGE_KEY = 'bywilliaml-polaroid-url'

export default function AdminPage() {
  const [url, setUrl] = useState('')
  const [saved, setSaved] = useState('')
  const [preview, setPreview] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || ''
    setSaved(stored)
    setUrl(stored)
    setPreview(stored)
  }, [])

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, url)
    setSaved(url)
    setPreview(url)
  }

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUrl('')
    setSaved('')
    setPreview('')
  }

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center px-5 py-20">
      <div className="absolute top-6 left-6">
        <Link
          href="/about"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Admin</h1>
      <p className="text-white/40 text-xs mb-8">update polaroid photo</p>

      <div className="w-full max-w-md space-y-4">
        <div>
          <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">
            image url
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/15 transition-colors"
          >
            save
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-3 rounded-xl text-sm font-medium bg-white/[0.05] text-white/50 hover:bg-white/10 transition-colors"
          >
            clear
          </button>
        </div>

        {saved && (
          <p className="text-green-400/70 text-xs text-center">saved — reload about page to see it</p>
        )}

        {preview && (
          <div className="mt-6">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">preview</p>
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white/[0.04] border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setPreview('')}
              />
            </div>
          </div>
        )}

        {!preview && !saved && (
          <p className="text-white/30 text-xs text-center mt-4">
            no custom image set — using github avatar
          </p>
        )}
      </div>
    </div>
  )
}
