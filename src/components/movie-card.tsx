import Image from 'next/image'
import { getPosterUrl, getProviderLogoUrl } from '@/lib/tmdb'
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
}

export function MovieCard({ movie, providers }: MovieCardProps) {
  const title = getTitle(movie)
  const year = getYear(movie)
  const posterUrl = getPosterUrl(movie.poster_path, 'w342')
  const topProviders = getTopProviders(providers)
  const ratingClass = getRatingClass(movie.vote_average)
  const fallbackLink =
    providers?.link ??
    `https://www.google.com/search?q=${encodeURIComponent(`${title} смотреть онлайн`)}`

  return (
    <article className="group flex flex-col rounded-lg overflow-hidden bg-card border border-border hover:bg-surface-hover transition-colors">
      <div className="relative aspect-[2/3] w-full bg-muted">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
            Нет постера
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <h3 className="text-sm font-medium leading-tight line-clamp-2">{title}</h3>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{year}</span>
          {movie.vote_count > 0 && (
            <span className={`font-semibold ${ratingClass}`}>
              ★ {movie.vote_average.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 min-h-6">
          {topProviders.length > 0 ? (
            topProviders.map((provider) => (
              <Image
                key={provider.provider_id}
                src={getProviderLogoUrl(provider.logo_path)}
                alt={provider.provider_name}
                width={24}
                height={24}
                className="rounded-sm"
                title={provider.provider_name}
              />
            ))
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
      </div>
    </article>
  )
}
