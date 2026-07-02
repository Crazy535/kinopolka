import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { auth } from '@/auth'
import { getTVShowDetailsEnriched, getTVRecommendations, getTVVideos, localizePeopleNames } from '@/lib/tmdb'
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

interface TVPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TVPageProps): Promise<Metadata> {
  const { id } = await params
  const tvId = Number(id)
  if (!tvId || isNaN(tvId)) return {}

  try {
    const show = await getTVShowDetailsEnriched(tvId)
    const posterUrl = getPosterUrl(show.poster_path, 'w500')
    const year = show.first_air_date ? show.first_air_date.slice(0, 4) : ''
    const title = year ? `${show.name} (${year})` : show.name
    const description = show.overview?.slice(0, 160) ?? `Сериал ${show.name} на Кинополке`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'video.tv_show',
        url: `${BASE_URL}/tv/${id}`,
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

export default async function TVPage({ params }: TVPageProps) {
  const [{ id }, session] = await Promise.all([params, auth()])
  const userType = session ? 'auth' : 'anon'
  const tvId = Number(id)
  if (!tvId || isNaN(tvId)) notFound()

  let show, recommendations, videos
  try {
    ;[show, recommendations, videos] = await Promise.all([
      getTVShowDetailsEnriched(tvId),
      getTVRecommendations(tvId),
      getTVVideos(tvId),
    ])
  } catch {
    notFound()
  }

  const trailer = videos.results.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
  ) ?? videos.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube')

  const backdropUrl = getBackdropUrl(show.backdrop_path, 'w1280')
  const posterUrl = getPosterUrl(show.poster_path, 'w500')
  const providers = show['watch/providers']?.results?.['RU'] ?? null
  const rawCast = show.credits?.cast ?? []
  const rawCrew = show.credits?.crew ?? []
  const creator = show.created_by?.[0] ?? null
  const directorRaw = creator
    ? { id: creator.id, name: creator.name, job: 'Director', department: 'Directing', profile_path: creator.profile_path }
    : rawCrew.find((c) => c.job === 'Director')
  const castTop8 = rawCast.slice(0, 8)
  const [cast, localizedDirector] = await Promise.all([
    localizePeopleNames(castTop8),
    directorRaw ? localizePeopleNames([directorRaw]).then((r) => r[0]) : Promise.resolve(undefined),
  ])
  const year = show.first_air_date ? show.first_air_date.slice(0, 4) : '—'
  const directorName = localizedDirector?.name
  const topCast = cast.slice(0, 3).map((c) => c.name)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.name,
    ...(show.original_name !== show.name && { alternateName: show.original_name }),
    ...(show.first_air_date && { startDate: show.first_air_date }),
    ...(show.overview && { description: show.overview }),
    ...(posterUrl && { image: posterUrl }),
    url: `${BASE_URL}/tv/${tvId}`,
    ...(show.genres?.length && { genre: show.genres.map((g) => g.name) }),
    ...(show.number_of_seasons && { numberOfSeasons: show.number_of_seasons }),
    ...(show.number_of_episodes && { numberOfEpisodes: show.number_of_episodes }),
    ...(directorName && { creator: { '@type': 'Person', name: directorName } }),
    ...(topCast.length > 0 && {
      actor: topCast.map((name) => ({ '@type': 'Person', name })),
    }),
    ...(show.vote_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: show.vote_average.toFixed(1),
        ratingCount: show.vote_count,
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
            alt={show.name}
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
                alt={show.name}
                fill
                sizes="(max-width: 640px) 96px, 144px"
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">{show.name}</h1>
              {show.original_name !== show.name && (
                <p className="mt-0.5 text-sm text-muted-foreground">{show.original_name}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="text-muted-foreground">{year}</span>
              {show.number_of_seasons && (
                <span className="text-muted-foreground">
                  {show.number_of_seasons}{' '}
                  {show.number_of_seasons === 1
                    ? 'сезон'
                    : show.number_of_seasons < 5
                      ? 'сезона'
                      : 'сезонов'}
                </span>
              )}
              {show.vote_count > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Star className="size-4 fill-current text-gold" aria-hidden />
                  {show.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {show.genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {show.tagline && (
              <p className="text-sm italic text-muted-foreground">«{show.tagline}»</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <WatchlistButton
              tmdbId={tvId}
              mediaType="tv"
              title={show.name}
              posterPath={show.poster_path}
            />
            {trailer && <TrailerButton trailerKey={trailer.key} title={show.name} />}
            <StarRating tmdbId={tvId} mediaType="tv" />
            {session && show.genres && show.genres.length > 0 && (
              <AddToTasteButton genreIds={show.genres.map((g) => g.id)} />
            )}
          </div>

          {(show.overview || show.tagline || show.production_countries?.length) && (
            <OverviewSection
              overview={show.overview}
              tagline={show.tagline}
              countries={show.production_countries}
              episodeInfo={
                show.number_of_seasons
                  ? `${show.number_of_seasons} ${show.number_of_seasons === 1 ? 'сезон' : show.number_of_seasons < 5 ? 'сезона' : 'сезонов'}${show.number_of_episodes ? `, ${show.number_of_episodes} эп.` : ''}`
                  : undefined
              }
            />
          )}

          <AiExplanation
            title={show.name}
            year={year !== '—' ? year : undefined}
            genres={show.genres?.map((g) => g.name) ?? []}
            director={directorName}
            cast={topCast}
            overview={show.overview?.slice(0, 100)}
          />

          <WatchProvidersBlock providers={providers} title={show.name} userType={userType} />

          {(cast.length > 0 || localizedDirector) && (
            <CastRow cast={cast} crew={localizedDirector ? [localizedDirector] : []} />
          )}

          <RelatedSection items={recommendations.results} mediaType="tv" />
        </div>
      </div>
    </div>
    </>
  )
}
