import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getMovieDetailsEnriched } from '@/lib/tmdb'
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb-image'
import { WatchProvidersBlock } from '@/components/movie-detail/watch-providers-block'
import { CastRow } from '@/components/movie-detail/cast-row'
import { WatchlistButton } from '@/components/movie-detail/watchlist-button'
import { StarRating } from '@/components/movie-detail/star-rating'

export const revalidate = 86400

interface MoviePageProps {
  params: Promise<{ id: string }>
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params
  const movieId = Number(id)
  if (!movieId || isNaN(movieId)) notFound()

  let movie
  try {
    movie = await getMovieDetailsEnriched(movieId)
  } catch {
    notFound()
  }

  const backdropUrl = getBackdropUrl(movie.backdrop_path, 'w1280')
  const posterUrl = getPosterUrl(movie.poster_path, 'w500')
  const providers = movie['watch/providers']?.results?.['RU'] ?? null
  const cast = movie.credits?.cast ?? []
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '—'
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)} ч ${movie.runtime % 60} мин`
    : null

  return (
    <div>
      {backdropUrl && (
        <div className="relative -mx-4 mb-8 h-48 sm:h-64 md:h-80">
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="pb-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          На главную
        </Link>

        <div className="flex gap-5 sm:gap-8">
          {posterUrl && (
            <div className="relative hidden aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl sm:block">
              <Image
                src={posterUrl}
                alt={movie.title}
                fill
                sizes="144px"
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{movie.title}</h1>
              {movie.original_title !== movie.title && (
                <p className="mt-0.5 text-sm text-muted-foreground">{movie.original_title}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="text-muted-foreground">{year}</span>
              {runtime && <span className="text-muted-foreground">{runtime}</span>}
              {movie.vote_count > 0 && (
                <span className="font-semibold">★ {movie.vote_average.toFixed(1)}</span>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {movie.tagline && (
              <p className="text-sm italic text-muted-foreground">«{movie.tagline}»</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <WatchlistButton
              tmdbId={movieId}
              mediaType="movie"
              title={movie.title}
              posterPath={movie.poster_path}
            />
            <StarRating tmdbId={movieId} mediaType="movie" />
          </div>

          {movie.overview && (
            <p className="text-sm leading-relaxed text-foreground/80 sm:text-base">
              {movie.overview}
            </p>
          )}

          <WatchProvidersBlock providers={providers} title={movie.title} />

          {cast.length > 0 && <CastRow cast={cast} />}
        </div>
      </div>
    </div>
  )
}
