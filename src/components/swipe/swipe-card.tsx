'use client'

import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useRef,
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion'
import { Star } from 'lucide-react'
import { getPosterUrl } from '@/lib/tmdb-image'
import { getGenreNames } from '@/lib/tmdb-genres'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

export interface SwipeItem {
  movie: TMDBMovie | TMDBTVShow
  mediaType: 'movie' | 'tv'
}

export interface SwipeCardHandle {
  triggerLike: () => void
  triggerSkip: () => void
}

interface SwipeCardProps {
  item: SwipeItem
  stackIndex: number
  onLike: () => void
  onSkip: () => void
}

const SWIPE_THRESHOLD = 80
const FLY_DURATION = 0.32

function getTitle(movie: TMDBMovie | TMDBTVShow): string {
  return 'title' in movie ? movie.title : movie.name
}

function getYear(movie: TMDBMovie | TMDBTVShow): string {
  if ('release_date' in movie) return movie.release_date?.slice(0, 4) ?? ''
  return (movie as TMDBTVShow).first_air_date?.slice(0, 4) ?? ''
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  function SwipeCardInner({ item, stackIndex, onLike, onSkip }, ref) {
    const { movie, mediaType } = item
    const isTop = stackIndex === 0
    const animatingRef = useRef(false)

    const x = useMotionValue(0)
    const opacity = useMotionValue(1)
    const rotate = useTransform(x, [-250, 250], [-22, 22])
    const likeOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1])
    const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0])

    const title = getTitle(movie)
    const year = getYear(movie)
    const posterUrl = getPosterUrl(movie.poster_path, 'w500')
    const genreNames = getGenreNames(movie.genre_ids, mediaType === 'tv').slice(0, 2)
    const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null
    const detailHref = `/${mediaType}/${movie.id}`

    const triggerLike = useCallback(async () => {
      if (animatingRef.current) return
      animatingRef.current = true
      await Promise.all([
        animate(x, 650, { duration: FLY_DURATION, ease: 'easeIn' }),
        animate(opacity, 0, { duration: FLY_DURATION * 0.8, ease: 'easeIn' }),
      ])
      onLike()
    }, [x, opacity, onLike])

    const triggerSkip = useCallback(async () => {
      if (animatingRef.current) return
      animatingRef.current = true
      await Promise.all([
        animate(x, -650, { duration: FLY_DURATION, ease: 'easeIn' }),
        animate(opacity, 0, { duration: FLY_DURATION * 0.8, ease: 'easeIn' }),
      ])
      onSkip()
    }, [x, opacity, onSkip])

    useImperativeHandle(ref, () => ({ triggerLike, triggerSkip }), [triggerLike, triggerSkip])

    async function handleDragEnd(_: unknown, info: PanInfo) {
      if (info.offset.x > SWIPE_THRESHOLD) {
        await triggerLike()
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        await triggerSkip()
      }
    }

    // Background stacked cards
    if (!isTop) {
      const scale = 1 - stackIndex * 0.045
      const yShift = -(stackIndex * 14)
      return (
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border border-border/20 bg-surface"
          style={{
            transform: `scale(${scale}) translateY(${yShift}px)`,
            zIndex: 10 - stackIndex,
            willChange: 'transform',
          }}
        >
          {posterUrl && (
            <Image src={posterUrl} alt="" fill className="object-cover" sizes="360px" />
          )}
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )
    }

    return (
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-2xl border border-border/20 bg-surface cursor-grab active:cursor-grabbing"
        style={{ x, rotate, opacity, zIndex: 20, touchAction: 'none' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.85}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover pointer-events-none select-none"
            priority
            draggable={false}
            sizes="(max-width: 640px) 360px, 400px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-5xl">🎬</div>
        )}

        {/* Like stamp */}
        <motion.div
          className="absolute left-5 top-8"
          style={{ opacity: likeOpacity, rotate: -25 }}
        >
          <span className="block rounded-lg border-4 border-emerald-400 px-3 py-1 text-xl font-black tracking-widest text-emerald-400">
            ЛАЙК
          </span>
        </motion.div>

        {/* Skip stamp */}
        <motion.div
          className="absolute right-5 top-8"
          style={{ opacity: skipOpacity, rotate: 25 }}
        >
          <span className="block rounded-lg border-4 border-rose-400 px-3 py-1 text-xl font-black tracking-widest text-rose-400">
            ПАСС
          </span>
        </motion.div>

        {/* Bottom info overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/55 to-transparent px-5 pb-5 pt-24">
          <Link
            href={detailHref}
            className="pointer-events-auto group block"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <h2 className="line-clamp-2 text-xl font-bold leading-tight text-white group-hover:underline">
              {title}
            </h2>
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {year && <span className="text-sm text-white/60">{year}</span>}
            {rating && (
              <span className="flex items-center gap-1 text-sm text-white/60">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {rating}
              </span>
            )}
            {genreNames.map((g) => (
              <span
                key={g}
                className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/90"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }
)
