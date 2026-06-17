'use client'

import { useState, useRef } from 'react'
import { Sparkles, SendHorizonal, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MovieCard } from '@/components/movie-card'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import type { AiRecommendResult } from '@/app/api/ai-recommend/route'

const CHIPS = [
  'Хочу что-то атмосферное',
  'Лёгкая комедия на час',
  'Детектив с неожиданным финалом',
  'На вечер с друзьями',
  'Что-то необычное',
  'Фильм как у Нолана',
]

export function AiRecommender() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AiRecommendResult[] | null>(null)
  const [lastQuery, setLastQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function submit(q: string) {
    const trimmed = q.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError(null)
    setResults(null)
    setLastQuery(trimmed)

    try {
      const res = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 503) throw new Error('ИИ-сервис сейчас недоступен')
        if (res.status === 401) throw new Error('Необходима авторизация')
        if (res.status === 502) throw new Error('Сервис временно не отвечает, попробуйте позже')
        throw new Error('Что-то пошло не так, попробуйте другой запрос')
      }
      setResults(data.results)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Что-то пошло не так')
    } finally {
      setLoading(false)
    }
  }

  function handleChip(chip: string) {
    setQuery(chip)
    submit(chip)
  }

  function handleReset() {
    setResults(null)
    setError(null)
    setQuery('')
    setLastQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const showChips = !results && !loading

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.8} />
        <h2 className="text-lg font-bold tracking-tight">ИИ-подбор</h2>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(query)
        }}
        className="mb-3 flex gap-2"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Хочу что-то атмосферное на один вечер..."
          className="min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          disabled={loading}
          maxLength={200}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          aria-label="Найти"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-35"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </button>
      </form>

      {/* Suggestion chips */}
      <AnimatePresence>
        {showChips && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex flex-wrap gap-2"
          >
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChip(chip)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {chip}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Last query label + reset */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                По запросу: <span className="text-foreground">&laquo;{lastQuery}&raquo;</span>
              </p>
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Новый запрос
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {results.map(({ movie, reason }) => (
                <div key={movie.id} className="flex flex-col gap-1.5">
                  <MovieCard movie={movie} providers={null} />
                  <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2 px-0.5">
                    {reason}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Не нашли подходящих фильмов. Попробуйте другой запрос.
        </p>
      )}
    </section>
  )
}
