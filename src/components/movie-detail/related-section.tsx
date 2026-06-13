import Image from 'next/image'
import Link from 'next/link'
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
  const top = items.filter((i) => i.poster_path && i.vote_count > 10).slice(0, 6)
  if (top.length === 0) return null

  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Похожее
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {top.map((item) => {
          const title = getTitle(item)
          const href = `/${mediaType}/${item.id}`
          const posterUrl = getPosterUrl(item.poster_path, 'w185')

          return (
            <Link key={item.id} href={href} className="group shrink-0">
              <div className="relative aspect-[2/3] w-24 overflow-hidden rounded-lg bg-muted">
                {posterUrl && (
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    sizes="96px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-1.5 w-24 line-clamp-2 text-[11px] font-medium leading-tight text-foreground/80">
                {title}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
