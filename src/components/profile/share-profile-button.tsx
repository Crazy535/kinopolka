'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface Props {
  userId: string
}

export function ShareProfileButton({ userId }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/profile/${userId}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
    >
      {copied ? (
        <>
          <Check className="size-4 text-emerald-500" />
          Скопировано
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          Поделиться профилем
        </>
      )}
    </button>
  )
}
