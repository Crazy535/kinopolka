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
  userGenreIds?: number[]
}

export function PartnerResults({ items, hostName, guestName, userGenreIds = [] }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-center text-slate-400 py-8">
        Не удалось найти фильмы. Попробуйте ещё раз.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white">
          Вы оба оценили
        </h2>
        {hostName && guestName && (
          <p className="mt-1 text-slate-400 text-sm">
            {hostName} + {guestName}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map(({ movie, providers }, i) => {
          const matchScore =
            userGenreIds.length > 0
              ? (calcMatchScore(movie.genre_ids ?? [], userGenreIds) ?? undefined)
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
                matchScore={matchScore}
              />
              <AiExplanation title={title} year={year} genres={genreNames} />
            </div>
          )
        })}
      </div>
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
