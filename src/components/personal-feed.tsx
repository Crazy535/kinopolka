import { prisma } from '@/lib/db'
import { discoverMovies, discoverTVShows, getMovieWatchProviders, getTVWatchProviders } from '@/lib/tmdb'
import { FeedMovieCard } from '@/components/feed-movie-card'
import { calcMatchScore } from '@/lib/match-score'
import type { RecommendationItem } from '@/types/quiz'

interface Props {
  userId: string
}

interface TasteProfile {
  genreIds: number[]
  movieIds: number[]
}

async function getGenreItems(profile: TasteProfile): Promise<RecommendationItem[]> {
  if (profile.genreIds.length === 0) return []

  const topGenres = profile.genreIds.slice(0, 3).join(',')
  const page = Math.floor(Math.random() * 3) + 1

  const data = await discoverMovies({
    sort_by: 'popularity.desc',
    with_genres: topGenres,
    'vote_count.gte': 50,
    'vote_average.gte': 6.0,
    page,
  })

  const seen = new Set(profile.movieIds)
  const candidates = data.results.filter((m) => !seen.has(m.id)).slice(0, 5)

  const providerResults = await Promise.all(
    candidates.map((m) => getMovieWatchProviders(m.id).catch(() => null))
  )

  return candidates.map((movie, i) => ({
    movie,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))
}

async function getTVItems(profile: TasteProfile): Promise<RecommendationItem[]> {
  if (profile.genreIds.length === 0) return []

  const topGenres = profile.genreIds.slice(0, 3).join(',')
  const page = Math.floor(Math.random() * 3) + 1

  const data = await discoverTVShows({
    sort_by: 'popularity.desc',
    with_genres: topGenres,
    'vote_count.gte': 30,
    'vote_average.gte': 6.0,
    page,
  })

  const candidates = data.results.slice(0, 5)

  const providerResults = await Promise.all(
    candidates.map((m) => getTVWatchProviders(m.id).catch(() => null))
  )

  return candidates.map((show, i) => ({
    movie: show,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))
}

async function getPeopleItems(userId: string): Promise<{ items: RecommendationItem[]; personNames: string[] }> {
  const people = await prisma.favoritePerson.findMany({ where: { userId } })
  if (people.length === 0) return { items: [], personNames: [] }

  const actors = people.filter((p) => p.role === 'actor').map((p) => p.tmdbId)
  const directors = people.filter((p) => p.role === 'director').map((p) => p.tmdbId)

  const params: Parameters<typeof discoverMovies>[0] = {
    sort_by: 'popularity.desc',
    'vote_count.gte': 20,
    'vote_average.gte': 5.5,
  }
  if (actors.length > 0) params.with_cast = actors.slice(0, 4).join('|')
  if (directors.length > 0) params.with_crew = directors.slice(0, 2).join('|')

  const data = await discoverMovies(params)
  const candidates = data.results.slice(0, 5)

  const providerResults = await Promise.all(
    candidates.map((m) => getMovieWatchProviders(m.id).catch(() => null))
  )

  const items = candidates.map((movie, i) => ({
    movie,
    providers: providerResults[i]?.results?.['RU'] ?? null,
  }))

  const personNames = people.slice(0, 3).map((p) => p.name)
  return { items, personNames }
}

export async function PersonalFeed({ userId }: Props) {
  const profile = await prisma.tasteProfile.findUnique({
    where: { userId },
    select: { genreIds: true, movieIds: true },
  })

  const tasteProfile: TasteProfile = profile ?? { genreIds: [], movieIds: [] }

  const [genreItems, tvItems, { items: peopleItems, personNames }] = await Promise.all([
    getGenreItems(tasteProfile),
    getTVItems(tasteProfile),
    getPeopleItems(userId),
  ])

  if (genreItems.length === 0 && tvItems.length === 0 && peopleItems.length === 0) return null

  const userGenreIds = tasteProfile.genreIds

  return (
    <div className="mb-10 space-y-8">
      {/* People-based section */}
      {peopleItems.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">
            С {personNames.join(', ')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {peopleItems.map((item) => {
              const matchScore = userGenreIds.length > 0
                ? (calcMatchScore(item.movie.genre_ids, userGenreIds) ?? undefined)
                : undefined
              return (
                <FeedMovieCard
                  key={item.movie.id}
                  movie={item.movie}
                  providers={item.providers}
                  matchScore={matchScore}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Genre-based movies section */}
      {genreItems.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">Для тебя</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {genreItems.map((item) => {
              const matchScore = userGenreIds.length > 0
                ? (calcMatchScore(item.movie.genre_ids, userGenreIds) ?? undefined)
                : undefined
              return (
                <FeedMovieCard
                  key={item.movie.id}
                  movie={item.movie}
                  providers={item.providers}
                  matchScore={matchScore}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* TV section */}
      {tvItems.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">Сериалы для тебя</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tvItems.map((item) => {
              const matchScore = userGenreIds.length > 0
                ? (calcMatchScore(item.movie.genre_ids, userGenreIds) ?? undefined)
                : undefined
              return (
                <FeedMovieCard
                  key={item.movie.id}
                  movie={item.movie}
                  providers={item.providers}
                  matchScore={matchScore}
                />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
