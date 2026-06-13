'use client'

import { MovieCard } from '@/components/movie-card'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { useQuizStore } from '@/stores/quiz-store'
import type { RecommendationItem } from '@/types/quiz'

interface QuizResultsProps {
  results: RecommendationItem[]
  isLoading: boolean
  error: string | null
  onReset: () => void
}

export function QuizResults({ results, isLoading, error, onReset }: QuizResultsProps) {
  const ttwDuration = useQuizStore((s) => s.ttwDuration)

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold">Подбираем...</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium underline underline-offset-4 hover:text-primary"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-muted-foreground">Ничего не нашлось. Попробуй другой жанр.</p>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium underline underline-offset-4 hover:text-primary"
        >
          Начать заново
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Вот что посмотреть</h2>
          {ttwDuration !== null && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Подобрали за {ttwDuration.toFixed(1)} сек
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Начать заново
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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
