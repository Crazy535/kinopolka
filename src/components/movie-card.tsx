import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl, getProviderLogoUrl } from '@/lib/tmdb-image'
import type { TMDBMovie, TMDBTVShow, WatchProvider, WatchProvidersByType } from '@/types/tmdb'

type MovieLike = TMDBMovie | TMDBTVShow

function getTitle(item: MovieLike): string {
  return 'title' in item ? item.title : item.name
}

function getYear(item: MovieLike): string {
  const date = 'release_date' in item ? item.release_date : item.first_air_date
  return date ? date.slice(0, 4) : '—'
}

function getRatingClass(score: number): string {
  if (score >= 7.5) return 'text-rating-high'
  if (score >= 6) return 'text-rating-mid'
  return 'text-rating-low'
}

function getTopProviders(providers: WatchProvidersByType | null): WatchProvider[] {
  if (!providers) return []
  const ordered = [
    ...(providers.flatrate ?? []),
    ...(providers.free ?? []),
    ...(providers.ads ?? []),
    ...(providers.rent ?? []),
  ]
  const seen = new Set<number>()
  return ordered.filter((p) => {
    if (seen.has(p.provider_id)) return false
    seen.add(p.provider_id)
    return true
  }).slice(0, 3)
}

interface MovieCardProps {
  movie: MovieLike
  providers: WatchProvidersByType | null
  priority?: boolean
}

export function MovieCard({ movie, providers, priority = false }: MovieCardProps) {
  const title = getTitle(movie)
  const year = getYear(movie)
  const posterUrl = getPosterUrl(movie.poster_path, 'w342')
  const topProviders = getTopProviders(providers)
  const ratingClass = getRatingClass(movie.vote_average)
  const fallbackLink =
    providers?.link ??
    `https://www.google.com/search?q=${encodeURIComponent(`${title} смотреть онлайн`)}`
  const isMovie = 'title' in movie
  const detailHref = isMovie ? `/movie/${movie.id}` : `/tv/${movie.id}`

  return (
    <article className="group flex flex-col rounded-xl overflow-hidden bg-card border border-border hover:-translate-y-0.5 hover:shadow-xl hover:border-white/[0.15] transition-all duration-200">
      <Link href={detailHref} className="block">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
              Нет постера
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 px-3 pt-3">
          <h3 className="text-sm font-medium leading-tight line-clamp-2">{title}</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{year}</span>
            {movie.vote_count > 0 && (
              <span className={`font-semibold ${ratingClass}`}>
                ★ {movie.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-1.5 min-h-6 px-3 pb-3 pt-1.5">
        {topProviders.length > 0 ? (
          <a
            href={providers!.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5"
            aria-label="Где смотреть"
          >
            {topProviders.map((provider) => (
              <Image
                key={provider.provider_id}
                src={getProviderLogoUrl(provider.logo_path)}
                alt={provider.provider_name}
                width={24}
                height={24}
                className="rounded-sm"
                title={provider.provider_name}
              />
            ))}
          </a>
        ) : (
          <a
            href={fallbackLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Найти онлайн →
          </a>
        )}
      </div>
    </article>
  )
}
