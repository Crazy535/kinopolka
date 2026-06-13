import { prisma } from '@/lib/db'
import { discoverMovies, getMovieWatchProviders } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import type { RecommendationItem } from '@/types/quiz'

interface Props {
  userId: string
}

async function getPersonalItems(userId: string): Promise<RecommendationItem[]> {
  const profile = await prisma.tasteProfile.findUnique({
    where: { userId },
  })
  if (!profile || profile.genreIds.length === 0) return []

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

export async function PersonalFeed({ userId }: Props) {
  const items = await getPersonalItems(userId)
  if (items.length === 0) return null

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">Для тебя</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <MovieCard key={item.movie.id} movie={item.movie} providers={item.providers} />
        ))}
      </div>
    </section>
  )
}
