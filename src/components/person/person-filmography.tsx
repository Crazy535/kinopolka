import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl } from '@/lib/tmdb-image'
import type { TMDBPersonCastCredit } from '@/types/tmdb'

interface PersonFilmographyProps {
  credits: TMDBPersonCastCredit[]
}

export function PersonFilmography({ credits }: PersonFilmographyProps) {
  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Фильмография
      </p>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {credits.map((credit) => {
          const title = credit.title ?? credit.name ?? ''
          const href = credit.media_type === 'movie' ? `/movie/${credit.id}` : `/tv/${credit.id}`
          const posterUrl = getPosterUrl(credit.poster_path, 'w342')

          return (
            <Link key={`${credit.media_type}-${credit.id}`} href={href} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 17vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center px-2">
                    <span className="text-center text-[11px] text-muted-foreground">{title}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="line-clamp-2 text-[12px] font-medium leading-tight text-white">
                    {title}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
