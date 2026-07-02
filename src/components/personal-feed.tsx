import Link from 'next/link'
import { prisma } from '@/lib/db'
import { discoverMovies, discoverTVShows, getMovieWatchProviders, getTVWatchProviders, getPersonCombinedCredits } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import { PersonalFeedSearch } from '@/components/personal-feed-search'
import { FeedCarousel } from '@/components/feed-carousel'
import { AiRecommender } from '@/components/ai-recommender'
import { calcMatchScore } from '@/lib/match-score'
import { MOVIE_GENRES, TV_GENRES } from '@/lib/tmdb-genres'
import type { RecommendationItem } from '@/types/quiz'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

interface Props {
  userId: string
}

interface TasteProfile {
  genreIds: number[]
  movieIds: number[]
}

interface SectionResult {
  items: RecommendationItem[]
  sectionTitle: string
}

const DEFAULT_MOVIE_GENRE_IDS = [28, 35, 18]
const DEFAULT_TV_GENRE_IDS = [10759, 35, 18]

async function getGenreItems(profile: TasteProfile): Promise<SectionResult> {
  const usingDefaults = profile.genreIds.length === 0
  const topGenreIds = usingDefaults ? DEFAULT_MOVIE_GENRE_IDS : profile.genreIds.slice(0, 5)
  const topGenres = topGenreIds.join(',')
  const topGenreName = MOVIE_GENRES[topGenreIds[0]]?.toLowerCase() ?? 'любимые жанры'

  const page1 = Math.floor(Math.random() * 5) + 1
  const page2 = page1 < 5 ? page1 + 1 : page1 - 1

  const [data1, data2] = await Promise.all([
    discoverMovies({
      sort_by: 'popularity.desc',
      with_genres: topGenres,
      'vote_count.gte': 50,
      'vote_average.gte': 6.0,
      page: page1,
    }).catch(() => null),
    discoverMovies({
      sort_by: 'popularity.desc',
      with_genres: topGenres,
      'vote_count.gte': 50,
      'vote_average.gte': 6.0,
      page: page2,
    }).catch(() => null),
  ])
  const sectionTitleDefault = usingDefaults ? 'Фильмы для вас' : `Потому что ты любишь ${topGenreName}`
  if (!data1 || !data2) return { items: [], sectionTitle: sectionTitleDefault }

  const seen = new Set(profile.movieIds)
  const seenInBatch = new Set<number>()
  const candidates: TMDBMovie[] = []
  for (const m of [...data1.results, ...data2.results]) {
    if (!seen.has(m.id) && !seenInBatch.has(m.id)) {
      seenInBatch.add(m.id)
      candidates.push(m)
      if (candidates.length >= 15) break
    }
  }

  const providerResults = await Promise.all(
    candidates.map((m) => getMovieWatchProviders(m.id).catch(() => null))
  )

  const items: RecommendationItem[] = candidates.map((movie, i) => ({
    movie,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))

  const sectionTitle = usingDefaults ? 'Фильмы для вас' : `Потому что ты любишь ${topGenreName}`
  return { items, sectionTitle }
}

async function getTVItems(profile: TasteProfile, seenIds: Set<number>): Promise<SectionResult> {
  const usingDefaults = profile.genreIds.length === 0
  const topGenreIds = usingDefaults ? DEFAULT_TV_GENRE_IDS : profile.genreIds.slice(0, 5)
  const topGenres = topGenreIds.join(',')
  const topGenreName =
    (TV_GENRES[topGenreIds[0]] ?? MOVIE_GENRES[topGenreIds[0]])?.toLowerCase() ?? 'любимые жанры'

  const page = Math.floor(Math.random() * 5) + 1

  const data = await discoverTVShows({
    sort_by: 'popularity.desc',
    with_genres: topGenres,
    'vote_count.gte': 30,
    'vote_average.gte': 6.0,
    page,
  }).catch(() => null)
  if (!data) return { items: [], sectionTitle: usingDefaults ? 'Сериалы для вас' : `Сериалы: ${topGenreName}` }

  const candidates = data.results.filter((s) => !seenIds.has(s.id)).slice(0, 8)

  const providerResults = await Promise.all(
    candidates.map((m) => getTVWatchProviders(m.id).catch(() => null))
  )

  const items: RecommendationItem[] = candidates.map((show, i) => ({
    movie: show,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))

  const sectionTitle = usingDefaults ? 'Сериалы для вас' : `Сериалы: ${topGenreName}`
  return { items, sectionTitle }
}

async function getPeopleItems(userId: string): Promise<{ items: RecommendationItem[]; personNames: string[] }> {
  const people = await prisma.favoritePerson.findMany({ where: { userId } })
  if (people.length === 0) return { items: [], personNames: [] }

  const creditsResults = await Promise.all(
    people.slice(0, 5).map((p) => getPersonCombinedCredits(p.tmdbId).catch(() => null))
  )

  const seen = new Set<string>()
  const movies: TMDBMovie[] = []
  const tvShows: TMDBTVShow[] = []

  for (const credits of creditsResults) {
    if (!credits) continue
    const qualified = credits.cast
      .filter((c) => c.vote_count >= 20 && c.vote_average >= 5.5)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20)

    for (const c of qualified) {
      const key = `${c.media_type}-${c.id}`
      if (seen.has(key)) continue
      seen.add(key)

      if (c.media_type === 'movie' && movies.length < 4) {
        movies.push({
          id: c.id,
          title: c.title ?? c.name ?? '',
          original_title: c.title ?? '',
          poster_path: c.poster_path,
          backdrop_path: null,
          vote_average: c.vote_average,
          vote_count: c.vote_count,
          release_date: c.release_date ?? '',
          genre_ids: [],
          popularity: c.popularity,
          overview: '',
          original_language: '',
          adult: false,
          video: false,
        })
      } else if (c.media_type === 'tv' && tvShows.length < 4) {
        tvShows.push({
          id: c.id,
          name: c.name ?? c.title ?? '',
          original_name: c.name ?? '',
          poster_path: c.poster_path,
          backdrop_path: null,
          vote_average: c.vote_average,
          vote_count: c.vote_count,
          first_air_date: c.first_air_date ?? '',
          genre_ids: [],
          popularity: c.popularity,
          overview: '',
          original_language: '',
          origin_country: [],
        })
      }
      if (movies.length >= 4 && tvShows.length >= 4) break
    }
    if (movies.length >= 4 && tvShows.length >= 4) break
  }

  const combined: (TMDBMovie | TMDBTVShow)[] = []
  const maxLen = Math.max(movies.length, tvShows.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < movies.length) combined.push(movies[i])
    if (i < tvShows.length) combined.push(tvShows[i])
  }
  const candidates = combined.slice(0, 8)

  const providerResults = await Promise.all(
    candidates.map((item) => {
      const isTV = 'name' in item
      return isTV
        ? getTVWatchProviders(item.id).catch(() => null)
        : getMovieWatchProviders(item.id).catch(() => null)
    })
  )

  const items: RecommendationItem[] = candidates.map((item, i) => ({
    movie: item,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))

  const personNames = people.slice(0, 3).map((p) => p.name)
  return { items, personNames }
}

function SectionCarousel({ items, userGenreIds }: { items: RecommendationItem[]; userGenreIds: number[] }) {
  return (
    <FeedCarousel>
      {items.map((item) => {
        const matchScore =
          userGenreIds.length > 0
            ? (calcMatchScore(item.movie.genre_ids, userGenreIds) ?? undefined)
            : undefined
        return (
          <div key={item.movie.id} className="w-[140px] flex-shrink-0 sm:w-[160px]">
            <MovieCard
              movie={item.movie}
              providers={item.providers}
              matchScore={matchScore}
            />
          </div>
        )
      })}
    </FeedCarousel>
  )
}

export async function PersonalFeed({ userId }: Props) {
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

  const tasteProfile: TasteProfile = profile ?? { genreIds: [], movieIds: [] }
  const seenTvSet = new Set(seenTvLogs.map((r) => r.tmdbId))

  const [
    { items: genreItems, sectionTitle: genreTitle },
    { items: tvItems, sectionTitle: tvTitle },
    { items: peopleItems, personNames },
  ] = await Promise.all([
    getGenreItems(tasteProfile),
    getTVItems(tasteProfile, seenTvSet),
    getPeopleItems(userId),
  ])

  if (genreItems.length === 0 && tvItems.length === 0 && peopleItems.length === 0) return null

  const userGenreIds = tasteProfile.genreIds

  return (
    <div className="mb-10 space-y-8">
      {/* Header + search */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">Ваша лента</h2>
        <PersonalFeedSearch />
      </div>

      {/* People-based section */}
      {peopleItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="min-w-0 text-base font-semibold tracking-tight">
              С {personNames.join(', ')}
            </h2>
            <Link
              href="/feed?type=people"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Показать все →
            </Link>
          </div>
          <SectionCarousel items={peopleItems} userGenreIds={userGenreIds} />
        </section>
      )}

      {/* Genre-based movies section */}
      {genreItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="min-w-0 text-base font-semibold tracking-tight">{genreTitle}</h2>
            <Link
              href="/feed?type=genre"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Показать все →
            </Link>
          </div>
          <SectionCarousel items={genreItems} userGenreIds={userGenreIds} />
        </section>
      )}

      {/* TV section */}
      {tvItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="min-w-0 text-base font-semibold tracking-tight">{tvTitle}</h2>
            <Link
              href="/feed?type=tv"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Показать все →
            </Link>
          </div>
          <SectionCarousel items={tvItems} userGenreIds={userGenreIds} />
        </section>
      )}

      {/* AI section (KIN-37B) */}
      <AiRecommender />
    </div>
  )
}
