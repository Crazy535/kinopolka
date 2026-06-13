import { getTrendingMovies, getMovieWatchProviders } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'

interface MovieGridProps {
  limit?: number
}

export async function MovieGrid({ limit = 10 }: MovieGridProps) {
  const { results } = await getTrendingMovies('week')
  const movies = results.slice(0, limit)

  const providerResults = await Promise.all(
    movies.map((m) => getMovieWatchProviders(m.id).catch(() => null))
  )

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie, i) => {
        const providers = providerResults[i]?.results?.['RU'] ?? null
        return <MovieCard key={movie.id} movie={movie} providers={providers} />
      })}
    </div>
  )
}
