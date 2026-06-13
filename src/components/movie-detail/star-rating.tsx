'use client'

import { useEffect, useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { setRating } from '@/actions/ratings'

interface StarRatingProps {
  tmdbId: number
  mediaType: 'movie' | 'tv'
}

export function StarRating({ tmdbId, mediaType }: StarRatingProps) {
  const [score, setScore] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch(`/api/ratings/mine?tmdbId=${tmdbId}&mediaType=${mediaType}`)
      .then((r) => r.json())
      .then((data) => {
        setScore(data.score)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [tmdbId, mediaType])

  function handleRate(value: number) {
    startTransition(async () => {
      try {
        const result = await setRating({ tmdbId, mediaType, score: value })
        setScore(result.score)
      } catch {
        // Not authenticated
      }
    })
  }

  const displayed = hovered ?? score

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">Ваша оценка</span>
      <div
        className={['flex items-center gap-0.5', !loaded ? 'opacity-40' : ''].join(' ')}
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            aria-label={`Оценить на ${val}`}
            disabled={isPending || !loaded}
            onClick={() => handleRate(val)}
            onMouseEnter={() => setHovered(val)}
            className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
          >
            <Star
              className={[
                'size-5 transition-colors',
                displayed !== null && val <= displayed
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-muted-foreground',
              ].join(' ')}
            />
          </button>
        ))}
        {score !== null && (
          <span className="ml-2 text-sm text-muted-foreground">{score}/5</span>
        )}
      </div>
    </div>
  )
}
