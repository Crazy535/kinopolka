import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl, getProviderLogoUrl } from '@/lib/tmdb-image'
import { CardSpotlight } from '@/components/movie-card-spotlight'
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
  matchScore?: number
}

export function MovieCard({ movie, providers, priority = false, matchScore }: MovieCardProps) {
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
    <CardSpotlight className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-muted transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-1 hover:shadow-[0_16px_52px_var(--color-card-glow)] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background">
      {/* Poster image */}
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.04]"
          priority={priority}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">Нет постера</span>
        </div>
      )}

      {/* Persistent gradient overlay — title always readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

      {/* % Match badge */}
      {typeof matchScore === 'number' && matchScore >= 60 && (
        <div className="absolute top-2 left-2 z-30 pointer-events-none">
          <span
            className={`inline-flex items-center rounded px-1.5 py-[3px] text-[12px] font-bold leading-none backdrop-blur-sm shadow-sm ${
              matchScore >= 80
                ? 'bg-emerald-500/85 text-white'
                : 'bg-amber-500/85 text-white'
            }`}
          >
            {matchScore}%
          </span>
        </div>
      )}

      {/* Main navigation link (covers full card) */}
      <Link href={detailHref} className="absolute inset-0 z-10 focus-visible:outline-none">
        <span className="sr-only">{title}</span>
      </Link>

      {/* Info — sits on the gradient, pointer-events-none so link remains clickable */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 pointer-events-none">
        <h3 className="text-[13px] font-semibold leading-tight text-white line-clamp-2">
          {title}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[12px] text-white/70">{year}</span>
          {movie.vote_count > 0 && (
            <span className={`text-[12px] font-bold ${ratingClass}`}>
              ★&nbsp;{movie.vote_average.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Provider logos — above main link (z-30), independently clickable */}
      {topProviders.length > 0 ? (
        <a
          href={providers!.link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2.5 right-2.5 z-30 flex items-center gap-1"
          aria-label="Где смотреть"
        >
          {topProviders.map((provider) => (
            <Image
              key={provider.provider_id}
              src={getProviderLogoUrl(provider.logo_path)}
              alt={provider.provider_name}
              width={20}
              height={20}
              className="rounded-[3px] opacity-90 shadow-sm"
              title={provider.provider_name}
            />
          ))}
        </a>
      ) : (
        <a
          href={fallbackLink}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2.5 right-2.5 z-30 text-[11px] text-white/75 transition-colors hover:text-white"
        >
          Найти&nbsp;→
        </a>
      )}

      {/* Hover ring + top crimson edge glow */}
      <div
        className="absolute inset-0 z-40 rounded-lg ring-1 ring-inset ring-white/0 transition-all duration-300 group-hover:ring-primary/45 pointer-events-none"
        aria-hidden
      />
    </CardSpotlight>
  )
}
