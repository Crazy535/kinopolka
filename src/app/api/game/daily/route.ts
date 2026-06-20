import { NextResponse } from 'next/server'
import { withTmdbCache } from '@/lib/tmdb-cache'
import { getPopularMovies, getMovieDetailsEnriched } from '@/lib/tmdb'

export const revalidate = 3600

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export async function GET() {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10)
  const dayOfYear = getDayOfYear(today)

  try {
    const data = await withTmdbCache(`daily-game-${dateStr}`, async () => {
      // Rotate through popular movie pages deterministically
      const page = (dayOfYear % 20) + 1
      const popular = await getPopularMovies(page)
      const candidates = popular.results.filter((m) => m.poster_path && m.vote_count > 500)
      if (candidates.length === 0) return null

      const movieStub = candidates[dayOfYear % candidates.length]
      const movie = await getMovieDetailsEnriched(movieStub.id)

      const year = movie.release_date?.slice(0, 4) ?? null
      const genres = (movie.genres ?? []).map((g: { name: string }) => g.name)
      const runtime = movie.runtime
        ? `${Math.floor(movie.runtime / 60)} ч ${movie.runtime % 60} мин`
        : null
      const countries = (movie.production_countries ?? [])
        .map((c: { name: string }) => c.name)
        .slice(0, 2)
      const cast = (movie.credits?.cast ?? []).slice(0, 1).map((a: { name: string }) => a.name)

      return {
        date: dateStr,
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title,
        posterPath: movie.poster_path,
        clues: { year, genres, runtime, countries, cast },
      }
    }, 86400)

    if (!data) return NextResponse.json({ error: 'No movie found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[daily-game]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
