'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { MovieCard } from '@/components/movie-card'
import { calcMatchScore } from '@/lib/match-score'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

interface CategoryCarouselProps {
  title: string
  items: (TMDBMovie | TMDBTVShow)[]
  browseHref: string
  userGenreIds?: number[]
}

export function CategoryCarousel({ title, items, browseHref, userGenreIds }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [checkScroll])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -(el.clientWidth * 0.75) : el.clientWidth * 0.75, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            whileTap={{ scale: 0.88 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
            aria-label="Назад"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          <motion.button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            whileTap={{ scale: 0.88 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
            aria-label="Вперёд"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
          <Link
            href={browseHref}
            className="ml-1 inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            Показать все
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
      <div className="relative">
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-3 z-10 w-12 bg-gradient-to-r from-background to-transparent" />
        )}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-3 z-10 w-12 bg-gradient-to-l from-background to-transparent" />
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => {
            const matchScore = userGenreIds
              ? (calcMatchScore(item.genre_ids, userGenreIds) ?? undefined)
              : undefined
            return (
              <div
                key={item.id}
                className="animate-reveal w-40 shrink-0 sm:w-44 lg:w-48"
                style={{ animationDelay: `${Math.min(i, 6) * 0.05}s` }}
              >
                <MovieCard movie={item} providers={null} priority={i === 0} matchScore={matchScore} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
