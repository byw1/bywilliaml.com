'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** A block of text with a copy button: the prompt for other AI tools. */
export function CopyBlock({ text, label = 'Copy prompt' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative rounded-[24px] border border-[var(--cr-line)] bg-black/40">
      <pre className="cr-code max-h-[360px] overflow-auto p-5 pr-5 pt-16 text-white/75 sm:pt-5 sm:pr-36">{text}</pre>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1600)
          } catch {
            setCopied(false)
          }
        }}
        className="cr-btn cr-btn-primary absolute right-3 top-3 min-h-0 px-4 py-2 text-sm"
      >
        {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        {copied ? 'Copied' : label}
      </button>
    </div>
  )
}
