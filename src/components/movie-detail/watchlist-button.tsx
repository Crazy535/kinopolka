'use client'

import { useEffect, useState, useTransition } from 'react'
import { Bookmark } from 'lucide-react'
import { toggleWatchlist } from '@/actions/watchlist'

interface WatchlistButtonProps {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  title: string
  posterPath: string | null
}

export function WatchlistButton({ tmdbId, mediaType, title, posterPath }: WatchlistButtonProps) {
  const [inWatchlist, setInWatchlist] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch(`/api/watchlist/status?tmdbId=${tmdbId}&mediaType=${mediaType}`)
      .then((r) => r.json())
      .then((data) => {
        setInWatchlist(data.inWatchlist)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [tmdbId, mediaType])

  function handleToggle() {
    startTransition(async () => {
      try {
        const result = await toggleWatchlist({ tmdbId, mediaType, title, posterPath })
        setInWatchlist(result.inWatchlist)
      } catch {
        // Not authenticated — silently ignore, button stays in current state
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending || !loaded}
      aria-label={inWatchlist ? 'Убрать из вотчлиста' : 'Добавить в вотчлист'}
      className={[
        'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        inWatchlist
          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border-border bg-background text-foreground hover:bg-muted',
      ].join(' ')}
    >
      <Bookmark
        className="size-4"
        fill={inWatchlist ? 'currentColor' : 'none'}
      />
      {inWatchlist ? 'В вотчлисте' : 'В вотчлист'}
    </button>
  )
}
