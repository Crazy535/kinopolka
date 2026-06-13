import { NextRequest, NextResponse } from 'next/server'
import { discoverMovies, getMovieWatchProviders } from '@/lib/tmdb'
import type { TMDBDiscoverMovieParams, TMDBMovie } from '@/types/tmdb'
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

    const excludeIdsParam = searchParams.get('exclude_ids')
    const excludeIds = new Set<number>(
      excludeIdsParam
        ? excludeIdsParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0)
        : []
    )

    const params: TMDBDiscoverMovieParams = {
      sort_by: 'popularity.desc',
      with_genres: genreId,
      'vote_count.gte': 100,
      'vote_average.gte': 6.5,
      page: randomPage(),
    }

    let chosenMovie: TMDBMovie | null = null
    let lastResults: TMDBMovie[] = []

    // Up to 3 attempts to find a non-excluded movie
    for (let attempt = 0; attempt < 3; attempt++) {
      const data = await discoverMovies({ ...params, page: randomPage() })

      if (!data.results.length) continue

      lastResults = data.results
      const candidates = data.results.filter((m) => !excludeIds.has(m.id))

      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(candidates.length, 10))
        chosenMovie = candidates[randomIndex]
        break
      }
    }

    // Fallback: if all attempts returned only excluded movies, pick any from last page
    if (!chosenMovie) {
      if (!lastResults.length) {
        return NextResponse.json({ error: 'No results found' }, { status: 404 })
      }
      const randomIndex = Math.floor(Math.random() * Math.min(lastResults.length, 10))
      chosenMovie = lastResults[randomIndex]
    }

    const providers = await getMovieWatchProviders(chosenMovie.id).catch(() => null)

    const item: RecommendationItem = {
      movie: chosenMovie,
      providers: providers?.results?.['RU'] ?? null,
    }

    return NextResponse.json({ item })
  } catch (err) {
    console.error('[roulette]', err)
    return NextResponse.json({ error: 'Failed to fetch roulette result' }, { status: 500 })
  }
}
