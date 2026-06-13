import { NextRequest, NextResponse } from 'next/server'
import {
  discoverMovies,
  discoverTVShows,
  getMovieWatchProviders,
  getTVWatchProviders,
} from '@/lib/tmdb'
import type { TMDBDiscoverMovieParams, TMDBDiscoverTVParams, TMDBMovie, TMDBTVShow } from '@/types/tmdb'
import type { ContentType, RuntimeOption, RecommendationItem } from '@/types/quiz'

export const dynamic = 'force-dynamic'

function randomPage(): number {
  return Math.floor(Math.random() * 3) + 1
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') as ContentType | null
    const genreId = searchParams.get('genre_id')
    const runtime = searchParams.get('runtime') as RuntimeOption | null

    if (!type || !genreId) {
      return NextResponse.json({ error: 'Missing required params: type, genre_id' }, { status: 400 })
    }

    let rawItems: (TMDBMovie | TMDBTVShow)[]

    if (type === 'movie') {
      const params: TMDBDiscoverMovieParams = {
        sort_by: 'popularity.desc',
        with_genres: genreId,
        'vote_count.gte': 100,
        'vote_average.gte': 6.5,
        page: randomPage(),
      }
      if (runtime === 'short') {
        params['with_runtime.lte'] = 90
      } else if (runtime === 'medium') {
        params['with_runtime.gte'] = 90
        params['with_runtime.lte'] = 150
      } else if (runtime === 'long') {
        params['with_runtime.gte'] = 150
      }

      const data = await discoverMovies(params)
      rawItems = data.results.slice(0, 5)
    } else {
      const params: TMDBDiscoverTVParams = {
        sort_by: 'popularity.desc',
        with_genres: genreId,
        'vote_count.gte': 50,
        'vote_average.gte': 6.5,
        page: randomPage(),
      }

      const data = await discoverTVShows(params)
      rawItems = data.results.slice(0, 5)
    }

    const providerFetcher = type === 'movie' ? getMovieWatchProviders : getTVWatchProviders
    const providerResults = await Promise.all(
      rawItems.map((m) => providerFetcher(m.id).catch(() => null))
    )

    const items: RecommendationItem[] = rawItems.map((movie, i) => ({
      movie,
      providers: providerResults[i]?.results?.['RU'] ?? null,
    }))

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[recommendations]', err)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}
