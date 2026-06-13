import { NextRequest, NextResponse } from 'next/server'
import { discoverMovies, getMovieWatchProviders } from '@/lib/tmdb'
import type { TMDBDiscoverMovieParams } from '@/types/tmdb'
import type { RecommendationItem } from '@/types/quiz'

export const dynamic = 'force-dynamic'

function randomPage(): number {
  return Math.floor(Math.random() * 5) + 1
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const genreId = searchParams.get('genre_id')

    if (!genreId) {
      return NextResponse.json({ error: 'Missing required param: genre_id' }, { status: 400 })
    }

    const params: TMDBDiscoverMovieParams = {
      sort_by: 'popularity.desc',
      with_genres: genreId,
      'vote_count.gte': 100,
      'vote_average.gte': 6.5,
      page: randomPage(),
    }

    const data = await discoverMovies(params)
    if (!data.results.length) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 })
    }

    const randomIndex = Math.floor(Math.random() * Math.min(data.results.length, 10))
    const movie = data.results[randomIndex]

    const providers = await getMovieWatchProviders(movie.id).catch(() => null)

    const item: RecommendationItem = {
      movie,
      providers: providers?.results?.['RU'] ?? null,
    }

    return NextResponse.json({ item })
  } catch (err) {
    console.error('[roulette]', err)
    return NextResponse.json({ error: 'Failed to fetch roulette result' }, { status: 500 })
  }
}
