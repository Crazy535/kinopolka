'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, X, Film, Tv, RefreshCw, BookmarkPlus } from 'lucide-react'
import { SwipeCard, type SwipeItem, type SwipeCardHandle } from './swipe-card'
import { useDiscoveryStore } from '@/stores/discovery-store'
import { toggleWatchlist } from '@/actions/watchlist'
import { trackSwipeLike, trackSwipeSkip } from '@/lib/analytics'

const REFETCH_THRESHOLD = 4

type ContentType = 'movie' | 'tv'

interface SwipeDeckProps {
  isAuthenticated: boolean
  userGenreIds?: number[]
}

export function SwipeDeck({ isAuthenticated, userGenreIds = [] }: SwipeDeckProps) {
  const [items, setItems] = useState<SwipeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contentType, setContentType] = useState<ContentType>('movie')
  const [likedCount, setLikedCount] = useState(0)
  const [isActing, setIsActing] = useState(false)

  const cardRef = useRef<SwipeCardHandle>(null)
  const fetchingRef = useRef(false)
  const { seenIds, addSeenIds } = useDiscoveryStore()

  const fetchBatch = useCallback(
    async (type: ContentType, excludeIds: number[], reset = false) => {
      if (fetchingRef.current) return
      fetchingRef.current = true
      if (reset) {
        setIsLoading(true)
        setError(null)
      }

      try {
        const params = new URLSearchParams({
          type,
          exclude_ids: excludeIds.slice(-150).join(','),
        })
        if (userGenreIds.length > 0) {
          params.set('genre_ids', userGenreIds.join(','))
        }

        const res = await fetch(`/api/swipe?${params}`)
        if (!res.ok) throw new Error()
        const { items: newItems } = (await res.json()) as { items: SwipeItem[] }

        addSeenIds(newItems.map((i) => i.movie.id))
        setItems((prev) => (reset ? newItems : [...prev, ...newItems]))
      } catch {
        if (reset) setError('Не удалось загрузить фильмы')
      } finally {
        if (reset) setIsLoading(false)
        fetchingRef.current = false
      }
    },
    [userGenreIds, addSeenIds]
  )

  // Initial fetch
  useEffect(() => {
    fetchBatch(contentType, seenIds, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function maybeFetchMore(remaining: SwipeItem[]) {
    if (remaining.length < REFETCH_THRESHOLD && !fetchingRef.current) {
      const excludeIds = [...seenIds, ...remaining.map((i) => i.movie.id)]
      fetchBatch(contentType, excludeIds)
    }
  }

  function handleTypeChange(type: ContentType) {
    if (type === contentType || isActing) return
    setContentType(type)
    setItems([])
    setLikedCount(0)
    fetchBatch(type, [], true)
  }

  async function handleLikeButton() {
    if (isActing || !cardRef.current || items.length === 0) return
    setIsActing(true)
    await cardRef.current.triggerLike()
    setIsActing(false)
  }

  async function handleSkipButton() {
    if (isActing || !cardRef.current || items.length === 0) return
    setIsActing(true)
    await cardRef.current.triggerSkip()
    setIsActing(false)
  }

  function handleLikeCompleted() {
    const item = items[0]
    if (!item) return

    setLikedCount((c) => c + 1)
    const newItems = items.slice(1)
    setItems(newItems)
    maybeFetchMore(newItems)

    trackSwipeLike(item.mediaType)

    if (isAuthenticated) {
      const { movie, mediaType } = item
      const title = 'title' in movie ? movie.title : movie.name
      toggleWatchlist({
        tmdbId: movie.id,
        mediaType,
        title,
        posterPath: movie.poster_path,
      }).catch(() => {})
    }
  }

  function handleSkipCompleted() {
    const newItems = items.slice(1)
    setItems(newItems)
    maybeFetchMore(newItems)
    trackSwipeSkip()
  }

  const visibleItems = items.slice(0, 3)
  const isEmpty = items.length === 0 && !isLoading

  return (
    <div className="flex flex-col gap-5">
      {/* Content type selector */}
      <div className="flex items-center gap-2">
        {(['movie', 'tv'] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              contentType === type
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {type === 'movie' ? <Film className="size-3.5" /> : <Tv className="size-3.5" />}
            {type === 'movie' ? 'Фильмы' : 'Сериалы'}
          </button>
        ))}

        {likedCount > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto flex items-center gap-1 text-sm text-emerald-500"
          >
            {isAuthenticated ? (
              <BookmarkPlus className="size-3.5" />
            ) : (
              <Heart className="size-3.5 fill-emerald-500" />
            )}
            {likedCount} {isAuthenticated ? 'в списке' : 'лайков'}
          </motion.span>
        )}
      </div>

      {/* Card deck */}
      <div className="relative mx-auto w-full max-w-sm" style={{ height: 'clamp(400px, calc(100dvh - 270px), 520px)' }}>
        {isLoading && items.length === 0 ? (
          <>
            <div
              className="absolute inset-0 overflow-hidden rounded-2xl border border-border/20 bg-surface"
              style={{ transform: 'scale(0.91) translateY(-28px)', zIndex: 8 }}
            />
            <div
              className="absolute inset-0 overflow-hidden rounded-2xl border border-border/20 bg-surface"
              style={{ transform: 'scale(0.955) translateY(-14px)', zIndex: 9 }}
            />
            <div className="absolute inset-0 overflow-hidden rounded-2xl border border-border/20 bg-surface" style={{ zIndex: 10 }}>
              <div className="h-full animate-shimmer" />
              <div className="absolute inset-x-0 bottom-0 space-y-2.5 bg-gradient-to-t from-black/80 to-transparent px-5 pb-5 pt-24">
                <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/15" />
                <div className="mt-2 flex gap-2">
                  <div className="h-3.5 w-10 animate-pulse rounded-full bg-white/10" />
                  <div className="h-3.5 w-20 animate-pulse rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          </>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => fetchBatch(contentType, seenIds, true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <RefreshCw className="size-4" />
              Повторить
            </button>
          </div>
        ) : isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card text-center px-8">
            <Film className="size-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Фильмы закончились</p>
            <button
              onClick={() => fetchBatch(contentType, [], true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <RefreshCw className="size-4" />
              Снова
            </button>
          </div>
        ) : (
          <>
            {visibleItems
              .slice()
              .reverse()
              .map((item, reversedIdx) => {
                const stackIndex = visibleItems.length - 1 - reversedIdx
                return (
                  <SwipeCard
                    key={item.movie.id}
                    ref={stackIndex === 0 ? cardRef : null}
                    item={item}
                    stackIndex={stackIndex}
                    onLike={handleLikeCompleted}
                    onSkip={handleSkipCompleted}
                  />
                )
              })}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-10">
        <motion.button
          whileTap={{ scale: 0.86 }}
          whileHover={{ scale: 1.07 }}
          onClick={handleSkipButton}
          disabled={isActing || isEmpty || isLoading}
          className="flex size-[64px] items-center justify-center rounded-full bg-card text-rose-500 ring-1 ring-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.12)] transition-shadow hover:shadow-[0_0_30px_rgba(239,68,68,0.28)] hover:ring-rose-500/55 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Пропустить"
        >
          <X className="size-7" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.86 }}
          whileHover={{ scale: 1.07 }}
          onClick={handleLikeButton}
          disabled={isActing || isEmpty || isLoading}
          className="flex size-[64px] items-center justify-center rounded-full bg-card text-emerald-500 ring-1 ring-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.12)] transition-shadow hover:shadow-[0_0_30px_rgba(52,211,153,0.28)] hover:ring-emerald-500/55 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="В список"
        >
          <Heart className="size-7" />
        </motion.button>
      </div>

      {/* Hint */}
      {!isEmpty && !isLoading && (
        <p className="text-center text-xs text-muted-foreground">
          {isAuthenticated
            ? '← пропустить · лайк → добавит в Вотчлист'
            : '← пропустить · лайк → понравился'}
        </p>
      )}

      {!isAuthenticated && likedCount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          <a href="/login" className="text-primary underline">
            Войдите
          </a>
          , чтобы сохранять фильмы в Вотчлист
        </p>
      )}
    </div>
  )
}
