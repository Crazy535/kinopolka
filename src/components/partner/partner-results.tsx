'use client'

import { MovieCard } from '@/components/movie-card'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { AiExplanation } from '@/components/ai-explanation'
import { calcMatchScore } from '@/lib/match-score'
import { MOVIE_GENRES, TV_GENRES } from '@/lib/tmdb-genres'
import type { RecommendationItem } from '@/types/quiz'

interface Props {
  items: RecommendationItem[]
  hostName: string | null
  guestName: string | null
  hostGenreIds: number[]
  guestGenreIds: number[]
  onRefresh?: () => void
  refreshing?: boolean
}

function calcPartnerScore(
  movieGenreIds: number[],
  hostGenreIds: number[],
  guestGenreIds: number[]
): number | undefined {
  const hostScore = calcMatchScore(movieGenreIds, hostGenreIds)
  const guestScore = calcMatchScore(movieGenreIds, guestGenreIds)
  const scores = [hostScore, guestScore].filter((s): s is number => s !== null)
  if (scores.length === 0) return undefined
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export function PartnerResults({
  items,
  hostName,
  guestName,
  hostGenreIds,
  guestGenreIds,
  onRefresh,
  refreshing,
}: Props) {
  const hasPartnerScores = hostGenreIds.length > 0 || guestGenreIds.length > 0

  if (items.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Не удалось найти фильмы. Попробуйте ещё раз.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Вы оба оценили
        </h2>
        {hostName && guestName && (
          <p className="mt-1 text-muted-foreground text-sm">
            {hostName} + {guestName}
          </p>
        )}
        {hasPartnerScores && (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500" />
              % — совместимость для вас обоих
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map(({ movie, providers }, i) => {
          const partnerScore = hasPartnerScores
            ? calcPartnerScore(movie.genre_ids ?? [], hostGenreIds, guestGenreIds)
            : undefined
          const title = 'title' in movie ? movie.title : movie.name
          const year = ('release_date' in movie ? movie.release_date : movie.first_air_date)?.slice(0, 4)
          const genreNames = (movie.genre_ids ?? [])
            .map((id) => MOVIE_GENRES[id] ?? TV_GENRES[id])
            .filter(Boolean) as string[]
          return (
            <div key={movie.id} className="flex flex-col gap-2">
              <MovieCard
                movie={movie}
                providers={providers}
                priority={i === 0}
                matchScore={partnerScore}
              />
              <AiExplanation title={title} year={year} genres={genreNames} />
            </div>
          )
        })}
      </div>

      {onRefresh && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? (
              <>
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Загружаем...
              </>
            ) : (
              <>
                <span className="text-base leading-none">↻</span>
                Другие варианты
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export function PartnerResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  )
}
