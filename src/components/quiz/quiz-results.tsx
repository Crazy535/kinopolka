'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Link2, MoreHorizontal, RefreshCw, RotateCcw, Send } from 'lucide-react'
import { MovieCard } from '@/components/movie-card'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { AiExplanation } from '@/components/ai-explanation'
import { useQuizStore } from '@/stores/quiz-store'
import { calcMatchScore } from '@/lib/match-score'
import { MOVIE_GENRES, TV_GENRES } from '@/lib/tmdb-genres'
import type { RecommendationItem } from '@/types/quiz'
import { trackQuizCompleted } from '@/lib/analytics'

interface QuizResultsProps {
  results: RecommendationItem[]
  isLoading: boolean
  error: string | null
  onReset: () => void
  onRefresh?: () => void
  userType?: 'anon' | 'auth'
  userGenreIds?: number[]
}

type CopyState = 'idle' | 'loading' | 'copied'

export function QuizResults({ results, isLoading, error, onReset, onRefresh, userType = 'anon', userGenreIds = [] }: QuizResultsProps) {
  const ttwDuration = useQuizStore((s) => s.ttwDuration)
  const type = useQuizStore((s) => s.type)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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
      genre_ids: movie.genre_ids ?? [],
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
    const text = encodeURIComponent('Кинополка подобрала мне фильмы за 30 сек')
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
          {/* ⋯ secondary actions */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              title="Ещё действия"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-border bg-popover py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => { void handleTelegram(); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Send className="h-3.5 w-3.5 text-[#2CA5E0]" />
                  Telegram
                </button>
                <button
                  type="button"
                  onClick={() => { void handleShare(); setMenuOpen(false) }}
                  disabled={copyState === 'loading'}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {copyState === 'copied' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-500">Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="h-3.5 w-3.5" />
                      Поделиться
                    </>
                  )}
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => { onReset(); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Заново
                </button>
              </div>
            )}
          </div>

          {/* Primary action */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex min-h-11 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Другие варианты
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {results.map(({ movie, providers }, i) => {
          const matchScore = userGenreIds.length > 0
            ? (calcMatchScore(movie.genre_ids, userGenreIds) ?? undefined)
            : undefined
          const title = 'title' in movie ? movie.title : movie.name
          const year = ('release_date' in movie ? movie.release_date : movie.first_air_date)?.slice(0, 4)
          const genreNames = (movie.genre_ids ?? [])
            .map((id) => MOVIE_GENRES[id] ?? TV_GENRES[id])
            .filter(Boolean) as string[]
          const overview = movie.overview ? movie.overview.slice(0, 100) : undefined
          return (
            <div key={movie.id} className="flex flex-col gap-2">
              <MovieCard
                movie={movie}
                providers={providers}
                priority={i === 0}
                matchScore={matchScore}
              />
              <AiExplanation title={title} year={year} genres={genreNames} overview={overview} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
