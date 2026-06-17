import Link from 'next/link'
import { prisma } from '@/lib/db'
import { discoverMovies, discoverTVShows, getMovieWatchProviders, getTVWatchProviders } from '@/lib/tmdb'
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

async function getGenreItems(profile: TasteProfile): Promise<SectionResult> {
  if (profile.genreIds.length === 0) return { items: [], sectionTitle: '' }

  const topGenreIds = profile.genreIds.slice(0, 5)
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
    }),
    discoverMovies({
      sort_by: 'popularity.desc',
      with_genres: topGenres,
      'vote_count.gte': 50,
      'vote_average.gte': 6.0,
      page: page2,
    }),
  ])

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

  return { items, sectionTitle: `Потому что ты любишь ${topGenreName}` }
}

async function getTVItems(profile: TasteProfile, seenIds: Set<number>): Promise<SectionResult> {
  if (profile.genreIds.length === 0) return { items: [], sectionTitle: '' }

  const topGenreIds = profile.genreIds.slice(0, 5)
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
  })

  const candidates = data.results.filter((s) => !seenIds.has(s.id)).slice(0, 8)

  const providerResults = await Promise.all(
    candidates.map((m) => getTVWatchProviders(m.id).catch(() => null))
  )

  const items: RecommendationItem[] = candidates.map((show, i) => ({
    movie: show,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))

  return { items, sectionTitle: `Сериалы: ${topGenreName}` }
}

async function getPeopleItems(userId: string): Promise<{ items: RecommendationItem[]; personNames: string[] }> {
  const people = await prisma.favoritePerson.findMany({ where: { userId } })
  if (people.length === 0) return { items: [], personNames: [] }

  const actors = people.filter((p) => p.role === 'actor').map((p) => p.tmdbId)
  const directors = people.filter((p) => p.role === 'director').map((p) => p.tmdbId)

  const movieParams: Parameters<typeof discoverMovies>[0] = {
    sort_by: 'popularity.desc',
    'vote_count.gte': 20,
    'vote_average.gte': 5.5,
  }
  const tvParams: Parameters<typeof discoverTVShows>[0] = {
    sort_by: 'popularity.desc',
    'vote_count.gte': 10,
    'vote_average.gte': 5.5,
  }
  if (actors.length > 0) {
    movieParams.with_cast = actors.slice(0, 4).join('|')
    tvParams.with_cast = actors.slice(0, 4).join('|')
  }
  if (directors.length > 0) {
    movieParams.with_crew = directors.slice(0, 2).join('|')
    tvParams.with_crew = directors.slice(0, 2).join('|')
  }

  const [movieData, tvData] = await Promise.all([
    discoverMovies(movieParams),
    discoverTVShows(tvParams),
  ])

  const movieCandidates = movieData.results.slice(0, 4)
  const tvCandidates = tvData.results.slice(0, 4)
  const combined: (TMDBMovie | TMDBTVShow)[] = []
  const maxLen = Math.max(movieCandidates.length, tvCandidates.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < movieCandidates.length) combined.push(movieCandidates[i])
    if (i < tvCandidates.length) combined.push(tvCandidates[i])
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
            <h2 className="text-base font-semibold tracking-tight">
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
            <h2 className="text-base font-semibold tracking-tight">{genreTitle}</h2>
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
            <h2 className="text-base font-semibold tracking-tight">{tvTitle}</h2>
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
