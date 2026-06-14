'use client'

import { useEffect, useState } from 'react'
import { Check, Link2, RefreshCw, Send } from 'lucide-react'
import { MovieCard } from '@/components/movie-card'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { useQuizStore } from '@/stores/quiz-store'
import type { RecommendationItem } from '@/types/quiz'
import { trackQuizCompleted } from '@/lib/analytics'

interface QuizResultsProps {
  results: RecommendationItem[]
  isLoading: boolean
  error: string | null
  onReset: () => void
  onRefresh?: () => void
  userType?: 'anon' | 'auth'
}

type CopyState = 'idle' | 'loading' | 'copied'

export function QuizResults({ results, isLoading, error, onReset, onRefresh, userType = 'anon' }: QuizResultsProps) {
  const ttwDuration = useQuizStore((s) => s.ttwDuration)
  const type = useQuizStore((s) => s.type)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    if (results.length > 0) {
      trackQuizCompleted(results.length, userType)
    }
  }, [results.length, userType])

  async function createShare(): Promise<string | null> {
    if (shareUrl) return shareUrl

    const movies = results.map(({ movie }) => ({
      id: movie.id,
      title: 'title' in movie ? movie.title : undefined,
      name: 'name' in movie ? movie.name : undefined,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      release_date: 'release_date' in movie ? movie.release_date : undefined,
      first_air_date: 'first_air_date' in movie ? movie.first_air_date : undefined,
    }))

    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieIds: results.map(({ movie }) => movie.id),
          mediaType: type ?? 'movie',
          params: { movies },
        }),
      })
      if (!res.ok) return null
      const { id } = (await res.json()) as { id: string }
      const url = `${window.location.origin}/shared/${id}`
      setShareUrl(url)
      return url
    } catch {
      return null
    }
  }

  async function handleShare() {
    if (copyState !== 'idle') return
    setCopyState('loading')
    try {
      const url = await createShare()
      if (!url) throw new Error()
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 3000)
    } catch {
      setCopyState('idle')
    }
  }

  async function handleTelegram() {
    const url = await createShare()
    const shareTarget = url ?? `${window.location.origin}/quiz`
    const text = encodeURIComponent('Кинополка подобрала мне фильмы за 30 сек 🎬')
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareTarget)}&text=${text}`,
      '_blank',
    )
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-6 font-heading text-2xl font-bold">Подбираем…</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-muted-foreground">Ничего не нашлось. Попробуй другой жанр.</p>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Начать заново
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-[-0.02em]">Вот что посмотреть</h2>
          <p className="text-xs text-muted-foreground">
            {results.length} {results.length === 1 ? 'вариант' : results.length < 5 ? 'варианта' : 'вариантов'}
          </p>
          {ttwDuration !== null && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Подобрали за&nbsp;
              <span className="font-semibold text-primary">{ttwDuration.toFixed(1)}&nbsp;сек</span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Telegram share */}
          <button
            type="button"
            onClick={() => void handleTelegram()}
            title="Поделиться в Telegram"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[#2CA5E0]/60 hover:text-[#2CA5E0]"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Telegram</span>
          </button>

          {/* Copy link */}
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={copyState === 'loading'}
            title="Скопировать ссылку"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copyState === 'copied' ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span className="hidden sm:inline text-green-500">Скопировано</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Поделиться</span>
              </>
            )}
          </button>

          {/* Refresh results */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Другие варианты"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Другие варианты</span>
            </button>
          )}

          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Заново
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {results.map(({ movie, providers }, i) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            providers={providers}
            priority={i === 0}
          />
        ))}
      </div>
    </div>
  )
}
