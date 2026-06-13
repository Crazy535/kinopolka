import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl, getProviderLogoUrl } from '@/lib/tmdb-image'
import { getGenreNames } from '@/lib/tmdb-genres'
import type { TMDBMovie, TMDBTVShow, WatchProvidersByType } from '@/types/tmdb'

type MovieLike = TMDBMovie | TMDBTVShow

function getTitle(item: MovieLike): string {
  return 'title' in item ? item.title : item.name
}

function getYear(item: MovieLike): string {
  const date = 'release_date' in item ? item.release_date : item.first_air_date
  return date ? date.slice(0, 4) : '—'
}

function isTV(item: MovieLike): boolean {
  return 'name' in item
}

interface FeedMovieCardProps {
  movie: MovieLike
  providers: WatchProvidersByType | null
  reason?: string
}

export function FeedMovieCard({ movie, providers, reason }: FeedMovieCardProps) {
  const title = getTitle(movie)
  const year = getYear(movie)
  const posterUrl = getPosterUrl(movie.poster_path, 'w185')
  const tv = isTV(movie)
  const detailHref = tv ? `/tv/${movie.id}` : `/movie/${movie.id}`
  const genreNames = getGenreNames(movie.genre_ids, tv)

  const topProviders = (() => {
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
  })()

  const ratingColor =
    movie.vote_average >= 7.5
      ? 'text-rating-high'
      : movie.vote_average >= 6
      ? 'text-rating-mid'
      : 'text-rating-low'

  return (
    <article className="group relative flex gap-4 rounded-xl border border-border/60 bg-card/40 p-3 transition-colors hover:bg-card/70 hover:border-border">
      {/* Poster */}
      <Link href={detailHref} className="shrink-0">
        <div className="relative w-[72px] aspect-[2/3] rounded-lg overflow-hidden bg-muted">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="72px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground text-center px-1">Нет постера</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col min-w-0 flex-1 gap-1.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <Link href={detailHref} className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2 hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          {movie.vote_count > 0 && (
            <span className={`text-xs font-bold tabular-nums shrink-0 ${ratingColor}`}>
              ★&nbsp;{movie.vote_average.toFixed(1)}
            </span>
          )}
        </div>

        {/* Year + genres */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground">{year}</span>
          {genreNames.map((name) => (
            <span
              key={name}
              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Overview */}
        {movie.overview && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {movie.overview}
          </p>
        )}

        {/* Footer: providers + reason */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {reason && (
            <span className="text-[10px] text-muted-foreground/70 italic truncate">{reason}</span>
          )}
          {topProviders.length > 0 ? (
            <a
              href={providers!.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 ml-auto shrink-0"
              aria-label="Где смотреть"
            >
              {topProviders.map((p) => (
                <Image
                  key={p.provider_id}
                  src={getProviderLogoUrl(p.logo_path)}
                  alt={p.provider_name}
                  width={18}
                  height={18}
                  className="rounded-[3px] opacity-80 hover:opacity-100 transition-opacity"
                  title={p.provider_name}
                />
              ))}
            </a>
          ) : (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${title} смотреть онлайн`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground ml-auto transition-colors"
            >
              Найти&nbsp;→
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
