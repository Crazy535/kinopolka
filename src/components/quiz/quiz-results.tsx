'use client'

import { useEffect } from 'react'
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
  userType?: 'anon' | 'auth'
}

export function QuizResults({ results, isLoading, error, onReset, userType = 'anon' }: QuizResultsProps) {
  const ttwDuration = useQuizStore((s) => s.ttwDuration)

  useEffect(() => {
    if (results.length > 0) {
      trackQuizCompleted(results.length, userType)
    }
  }, [results.length, userType])

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
          <h2 className="text-xl font-bold">Вот что посмотреть</h2>
          {ttwDuration !== null && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Подобрали за&nbsp;
              <span className="font-semibold text-primary">{ttwDuration.toFixed(1)}&nbsp;сек</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Заново
        </button>
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
