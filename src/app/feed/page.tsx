import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { discoverMovies, discoverTVShows, getMovieWatchProviders, getTVWatchProviders, getPersonCombinedCredits, getTrendingMovies } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import { calcMatchScore } from '@/lib/match-score'
import { MOVIE_GENRES, TV_GENRES } from '@/lib/tmdb-genres'
import type { RecommendationItem } from '@/types/quiz'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ type?: string; page?: string }>
}

type FeedType = 'genre' | 'tv' | 'people'

interface FeedResult {
  items: RecommendationItem[]
  title: string
}

const DEFAULT_MOVIE_GENRE_IDS = [28, 35, 18]

async function getGenreFeed(
  genreIds: number[],
  movieIds: number[],
  page: number
): Promise<FeedResult> {
  const usingDefaults = genreIds.length === 0
  const topGenreIds = usingDefaults ? DEFAULT_MOVIE_GENRE_IDS : genreIds.slice(0, 5)
  const topGenres = topGenreIds.join(',')
  const topGenreName = MOVIE_GENRES[topGenreIds[0]]?.toLowerCase() ?? 'любимые жанры'

  const base = (page - 1) * 5
  const pages = [
    base + Math.floor(Math.random() * 5) + 1,
    base + Math.floor(Math.random() * 5) + 1,
    base + Math.floor(Math.random() * 5) + 1,
  ]
  const fetches = pages.map((p) =>
    discoverMovies({
      sort_by: 'popularity.desc',
      with_genres: topGenres,
      'vote_count.gte': 50,
      'vote_average.gte': 6.0,
      page: p,
    })
  )
  const results = await Promise.all(fetches)

  const seen = new Set(movieIds)
  const seenInBatch = new Set<number>()
  const candidates: TMDBMovie[] = []
  for (const r of results) {
    for (const m of r.results) {
      if (!seen.has(m.id) && !seenInBatch.has(m.id)) {
        seenInBatch.add(m.id)
        candidates.push(m)
        if (candidates.length >= 40) break
      }
    }
    if (candidates.length >= 40) break
  }

  const providerResults = await Promise.all(
    candidates.map((m) => getMovieWatchProviders(m.id).catch(() => null))
  )

  const items: RecommendationItem[] = candidates.map((movie, i) => ({
    movie,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))

  const title = usingDefaults
    ? 'Популярные фильмы'
    : `Потому что ты любишь ${topGenreName}`
  return { items, title }
}

const DEFAULT_TV_GENRE_IDS = [10759, 35, 18]

async function getTVFeed(
  genreIds: number[],
  seenTvIds: Set<number>,
  page: number
): Promise<FeedResult> {
  const usingDefaults = genreIds.length === 0
  const topGenreIds = usingDefaults ? DEFAULT_TV_GENRE_IDS : genreIds.slice(0, 5)
  const topGenres = topGenreIds.join(',')
  const topGenreName =
    (TV_GENRES[topGenreIds[0]] ?? MOVIE_GENRES[topGenreIds[0]])?.toLowerCase() ?? 'любимые жанры'

  const base = (page - 1) * 5
  const pages = [
    base + Math.floor(Math.random() * 5) + 1,
    base + Math.floor(Math.random() * 5) + 1,
  ]
  const [d1, d2] = await Promise.all(
    pages.map((p) =>
      discoverTVShows({
        sort_by: 'popularity.desc',
        with_genres: topGenres,
        'vote_count.gte': 30,
        'vote_average.gte': 6.0,
        page: p,
      })
    )
  )

  const seenInBatch = new Set<number>()
  const candidates: TMDBTVShow[] = []
  for (const s of [...d1.results, ...d2.results]) {
    if (!seenTvIds.has(s.id) && !seenInBatch.has(s.id)) {
      seenInBatch.add(s.id)
      candidates.push(s)
      if (candidates.length >= 30) break
    }
  }

  const providerResults = await Promise.all(
    candidates.map((m) => getTVWatchProviders(m.id).catch(() => null))
  )

  const items: RecommendationItem[] = candidates.map((show, i) => ({
    movie: show,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))

  const title = usingDefaults ? 'Популярные сериалы' : `Сериалы: ${topGenreName}`
  return { items, title }
}

async function getPeopleFeed(userId: string, page: number): Promise<FeedResult> {
  const people = await prisma.favoritePerson.findMany({ where: { userId } })
  const offset = (page - 1) * 40

  if (people.length === 0) {
    const trending = await getTrendingMovies('week')
    const top = trending.results.slice(offset, offset + 40)
    const providerResults = await Promise.all(
      top.map((m) => getMovieWatchProviders(m.id).catch(() => null))
    )
    const items: RecommendationItem[] = top.map((movie, i) => ({
      movie,
      providers: providerResults[i]?.results?.['RU'] ?? null,
    }))
    return { items, title: 'Популярные фильмы' }
  }

  const creditsPerPerson = await Promise.all(
    people.map((p) => getPersonCombinedCredits(p.tmdbId).catch(() => null))
  )

  const seenIds = new Set<string>()
  const movies: TMDBMovie[] = []
  const tvShows: TMDBTVShow[] = []

  for (const credits of creditsPerPerson) {
    if (!credits) continue
    for (const credit of credits.cast) {
      const key = `${credit.media_type}-${credit.id}`
      if (seenIds.has(key) || credit.vote_count < 20 || credit.vote_average < 5.5) continue
      seenIds.add(key)
      if (credit.media_type === 'movie') {
        movies.push({
          id: credit.id,
          title: credit.title ?? '',
          original_title: credit.title ?? '',
          overview: '',
          poster_path: credit.poster_path,
          backdrop_path: null,
          release_date: credit.release_date ?? '',
          vote_average: credit.vote_average,
          vote_count: credit.vote_count,
          popularity: credit.popularity,
          genre_ids: [],
          original_language: '',
          adult: false,
          video: false,
        })
      } else {
        tvShows.push({
          id: credit.id,
          name: credit.name ?? '',
          original_name: credit.name ?? '',
          overview: '',
          poster_path: credit.poster_path,
          backdrop_path: null,
          first_air_date: credit.first_air_date ?? '',
          vote_average: credit.vote_average,
          vote_count: credit.vote_count,
          popularity: credit.popularity,
          genre_ids: [],
          original_language: '',
          origin_country: [],
        })
      }
    }
  }

  movies.sort((a, b) => b.popularity - a.popularity)
  tvShows.sort((a, b) => b.popularity - a.popularity)

  const combined: (TMDBMovie | TMDBTVShow)[] = []
  const movieTop = movies.slice(offset, offset + 20)
  const tvTop = tvShows.slice(offset, offset + 20)
  const maxLen = Math.max(movieTop.length, tvTop.length)
  for (let i = 0; i < maxLen && combined.length < 40; i++) {
    if (i < movieTop.length) combined.push(movieTop[i])
    if (i < tvTop.length && combined.length < 40) combined.push(tvTop[i])
  }

  const providerResults = await Promise.all(
    combined.map((item) => {
      const isTV = 'name' in item
      return isTV
        ? getTVWatchProviders(item.id).catch(() => null)
        : getMovieWatchProviders(item.id).catch(() => null)
    })
  )

  const items: RecommendationItem[] = combined.map((item, i) => ({
    movie: item,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))

  const names = people.slice(0, 3).map((p) => p.name)
  return { items, title: `С ${names.join(', ')}` }
}

const TYPE_LABELS: Record<FeedType, string> = {
  genre: 'Фильмы для вас',
  tv: 'Сериалы для вас',
  people: 'С любимыми актёрами',
}

export default async function FeedPage({ searchParams }: Props) {
  const [sp, session] = await Promise.all([searchParams, auth()])
  const rawType = sp.type ?? 'genre'
  const feedType: FeedType = rawType === 'tv' ? 'tv' : rawType === 'people' ? 'people' : 'genre'
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))

  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [profile, seenTvLogs] = await Promise.all([
    prisma.tasteProfile.findUnique({
      where: { userId },
      select: { genreIds: true, movieIds: true },
    }),
    prisma.watchLog.findMany({
      where: { userId, mediaType: 'tv' },
      select: { tmdbId: true },
    }),
  ])

  const genreIds = profile?.genreIds ?? []
  const movieIds = profile?.movieIds ?? []
  const seenTvSet = new Set(seenTvLogs.map((r) => r.tmdbId))

  let result: FeedResult
  if (feedType === 'tv') {
    result = await getTVFeed(genreIds, seenTvSet, page)
  } else if (feedType === 'people') {
    result = await getPeopleFeed(userId, page)
  } else {
    result = await getGenreFeed(genreIds, movieIds, page)
  }

  const { items, title } = result

  return (
    <div className="pb-12">
      <div className="mb-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{items.length} результатов</p>
      </div>

      {/* Type tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {(Object.entries(TYPE_LABELS) as [FeedType, string][]).map(([t, label]) => (
          <Link
            key={t}
            href={`/feed?type=${t}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              feedType === t
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Нет данных для отображения.</p>
          <Link href="/onboarding" className="mt-4 inline-block text-sm text-primary hover:underline">
            Настроить вкусы →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {items.map(({ movie, providers }) => {
              const matchScore =
                genreIds.length > 0
                  ? (calcMatchScore(movie.genre_ids, genreIds) ?? undefined)
                  : undefined
              return (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  providers={providers}
                  matchScore={matchScore}
                />
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            {page === 1 ? (
              <span
                aria-disabled="true"
                className="rounded-lg px-4 py-2 bg-slate-800 text-white opacity-40 pointer-events-none select-none"
              >
                ← Назад
              </span>
            ) : (
              <Link
                href={`/feed?type=${feedType}&page=${page - 1}`}
                className="rounded-lg px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                ← Назад
              </Link>
            )}
            <span className="text-sm text-muted-foreground">Страница {page}</span>
            <Link
              href={`/feed?type=${feedType}&page=${page + 1}`}
              className="rounded-lg px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Вперёд →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
