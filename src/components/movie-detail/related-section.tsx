'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPosterUrl } from '@/lib/tmdb-image'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

type ContentItem = TMDBMovie | TMDBTVShow

interface RelatedSectionProps {
  items: ContentItem[]
  mediaType: 'movie' | 'tv'
}

function getTitle(item: ContentItem): string {
  return 'title' in item ? item.title : item.name
}

export function RelatedSection({ items, mediaType }: RelatedSectionProps) {
  const top = items.filter((i) => i.poster_path && i.vote_count > 10).slice(0, 8)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function updateArrows() {
      if (!el) return
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }

    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [top.length])

  function scrollByAmount(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' })
  }

  if (top.length === 0) return null

  return (
    <div className="relative">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Похожее
      </p>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Прокрутить влево"
          className="absolute left-0 top-1/2 z-10 hidden size-8 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 shadow-md backdrop-blur-sm transition-colors hover:bg-muted sm:flex"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {top.map((item) => {
          const title = getTitle(item)
          const href = `/${mediaType}/${item.id}`
          const posterUrl = getPosterUrl(item.poster_path, 'w342')

          return (
            <Link key={item.id} href={href} className="group shrink-0">
              <div className="relative aspect-[2/3] w-36 overflow-hidden rounded-lg bg-muted">
                {posterUrl && (
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    sizes="144px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-2 w-36 line-clamp-2 text-xs font-medium leading-snug text-foreground/80">
                {title}
              </p>
            </Link>
          )
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Прокрутить вправо"
          className="absolute right-0 top-1/2 z-10 hidden size-8 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full border border-border bg-background/90 shadow-md backdrop-blur-sm transition-colors hover:bg-muted sm:flex"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  )
}
