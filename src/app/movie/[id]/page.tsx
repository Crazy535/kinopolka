import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { auth } from '@/auth'
import { getMovieDetailsEnriched, getMovieRecommendations, getMovieVideos, localizePeopleNames } from '@/lib/tmdb'
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb-image'
import { WatchProvidersBlock } from '@/components/movie-detail/watch-providers-block'
import { CastRow } from '@/components/movie-detail/cast-row'
import { WatchlistButton } from '@/components/movie-detail/watchlist-button'
import { StarRating } from '@/components/movie-detail/star-rating'
import { RelatedSection } from '@/components/movie-detail/related-section'
import { TrailerButton } from '@/components/movie-detail/trailer-button'
import { OverviewSection } from '@/components/movie-detail/overview-section'
import { AddToTasteButton } from '@/components/movie-detail/add-to-taste-button'
import { AiExplanation } from '@/components/ai-explanation'

export const revalidate = 86400

const BASE_URL = 'https://kinopolka.vercel.app'

interface MoviePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params
  const movieId = Number(id)
  if (!movieId || isNaN(movieId)) return {}

  try {
    const movie = await getMovieDetailsEnriched(movieId)
    const posterUrl = getPosterUrl(movie.poster_path, 'w500')
    const year = movie.release_date ? movie.release_date.slice(0, 4) : ''
    const title = year ? `${movie.title} (${year})` : movie.title
    const description = movie.overview?.slice(0, 160) ?? `Фильм ${movie.title} на Кинополке`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'video.movie',
        url: `${BASE_URL}/movie/${id}`,
        images: posterUrl ? [{ url: posterUrl, width: 500, height: 750 }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: posterUrl ? [posterUrl] : [],
      },
    }
  } catch {
    return {}
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const [{ id }, session] = await Promise.all([params, auth()])
  const userType = session ? 'auth' : 'anon'
  const movieId = Number(id)
  if (!movieId || isNaN(movieId)) notFound()

  let movie, recommendations, videos
  try {
    ;[movie, recommendations, videos] = await Promise.all([
      getMovieDetailsEnriched(movieId),
      getMovieRecommendations(movieId),
      getMovieVideos(movieId),
    ])
  } catch {
    notFound()
  }

  const trailer = videos.results.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
  ) ?? videos.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube')

  const backdropUrl = getBackdropUrl(movie.backdrop_path, 'w1280')
  const posterUrl = getPosterUrl(movie.poster_path, 'w500')
  const providers = movie['watch/providers']?.results?.['RU'] ?? null
  const rawCast = movie.credits?.cast ?? []
  const rawCrew = movie.credits?.crew ?? []
  const rawDirector = rawCrew.find((c) => c.job === 'Director')
  const castTop8 = rawCast.slice(0, 8)
  const [cast, localizedDirector] = await Promise.all([
    localizePeopleNames(castTop8),
    rawDirector ? localizePeopleNames([rawDirector]).then((r) => r[0]) : Promise.resolve(undefined),
  ])
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '—'
  const director = localizedDirector?.name
  const topCast = cast.slice(0, 3).map((c) => c.name)
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)} ч ${movie.runtime % 60} мин`
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    ...(movie.original_title !== movie.title && { alternateName: movie.original_title }),
    ...(movie.release_date && { datePublished: movie.release_date }),
    ...(movie.overview && { description: movie.overview }),
    ...(posterUrl && { image: posterUrl }),
    url: `${BASE_URL}/movie/${movieId}`,
    ...(movie.genres?.length && { genre: movie.genres.map((g) => g.name) }),
    ...(director && { director: { '@type': 'Person', name: director } }),
    ...(topCast.length > 0 && {
      actor: topCast.map((name) => ({ '@type': 'Person', name })),
    }),
    ...(movie.vote_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: movie.vote_average.toFixed(1),
        ratingCount: movie.vote_count,
        bestRating: '10',
        worstRating: '1',
      },
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div>
      {backdropUrl && (
        <div className="relative -mx-4 mb-8 h-72 md:h-96">
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
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          На главную
        </Link>

        <div className="flex gap-5 sm:gap-8">
          {posterUrl && (
            <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl sm:w-36">
              <Image
                src={posterUrl}
                alt={movie.title}
                fill
                sizes="(max-width: 640px) 96px, 144px"
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">{movie.title}</h1>
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
            {trailer && <TrailerButton trailerKey={trailer.key} title={movie.title} />}
            <StarRating tmdbId={movieId} mediaType="movie" />
            {session && movie.genres && movie.genres.length > 0 && (
              <AddToTasteButton genreIds={movie.genres.map((g) => g.id)} />
            )}
          </div>

          {(movie.overview || movie.tagline || movie.production_countries?.length) && (
            <OverviewSection
              overview={movie.overview}
              tagline={movie.tagline}
              countries={movie.production_countries}
            />
          )}

          <AiExplanation
            title={movie.title}
            year={year !== '—' ? year : undefined}
            genres={movie.genres?.map((g) => g.name) ?? []}
            director={director}
            cast={topCast}
            overview={movie.overview?.slice(0, 100)}
          />

          <WatchProvidersBlock providers={providers} title={movie.title} userType={userType} />

          {cast.length > 0 && (
            <CastRow cast={cast} crew={localizedDirector ? [localizedDirector] : []} />
          )}

          <RelatedSection items={recommendations.results} mediaType="movie" />
        </div>
      </div>
    </div>
    </>
  )
}
