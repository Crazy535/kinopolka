'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface Props {
  title: string
  year?: string
  genres?: string[]
  director?: string
  cast?: string[]
  overview?: string
}

export function AiExplanation({ title, year, genres, director, cast, overview }: Props) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  async function fetchExplanation() {
    if (fetched || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, year, genres, director, cast, overview }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { explanation: string }
      setText(data.explanation)
      setFetched(true)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  if (text) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.8} />
        <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={fetchExplanation}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-primary disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
      )}
      Почему стоит посмотреть?
    </button>
  )
}
