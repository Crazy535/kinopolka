'use client'

import { MovieCard } from '@/components/movie-card'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import type { RecommendationItem } from '@/types/quiz'

interface Props {
  items: RecommendationItem[]
  hostName: string | null
  guestName: string | null
}

export function PartnerResults({ items, hostName, guestName }: Props) {
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
        {items.map(({ movie, providers }, i) => (
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

export function PartnerResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  )
}
