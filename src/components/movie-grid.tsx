import { getTrendingMovies, getMovieWatchProviders } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import { calcMatchScore } from '@/lib/match-score'

interface MovieGridProps {
  limit?: number
  userGenreIds?: number[]
}

export async function MovieGrid({ limit = 10, userGenreIds }: MovieGridProps) {
  let results
  try {
    const data = await getTrendingMovies('week')
    results = data.results
  } catch {
    return null
  }
  const movies = results.slice(0, limit)

  const providerResults = await Promise.all(
    movies.map((m) => getMovieWatchProviders(m.id).catch(() => null))
  )

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie, i) => {
        const providers = providerResults[i]?.results?.['RU'] ?? null
        const matchScore = userGenreIds
          ? (calcMatchScore(movie.genre_ids, userGenreIds) ?? undefined)
          : undefined
        return (
          <div key={movie.id} className="animate-reveal" style={{ animationDelay: `${Math.min(i, 6) * 0.05}s` }}>
            <MovieCard
              movie={movie}
              providers={providers}
              priority={i === 0}
              matchScore={matchScore}
            />
          </div>
        )
      })}
    </div>
  )
}
