import { NextRequest, NextResponse } from 'next/server'
import { discoverMovies, discoverTVShows, getMovieWatchProviders, getTVWatchProviders } from '@/lib/tmdb'
import type { TMDBDiscoverMovieParams, TMDBDiscoverTVParams, TMDBMovie, TMDBTVShow } from '@/types/tmdb'
import type { RecommendationItem } from '@/types/quiz'

function randomPage(): number {
  return Math.floor(Math.random() * 5) + 1
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const genreId = searchParams.get('genre_id')
    const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie'

    if (!genreId) {
      return NextResponse.json({ error: 'Missing required param: genre_id' }, { status: 400 })
    }

    const excludeIdsParam = searchParams.get('exclude_ids')
    const excludeIds = new Set<number>(
      excludeIdsParam
        ? excludeIdsParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0)
        : []
    )

    let chosenItem: TMDBMovie | TMDBTVShow | null = null
    let lastResults: (TMDBMovie | TMDBTVShow)[] = []

    for (let attempt = 0; attempt < 3; attempt++) {
      if (type === 'tv') {
        const tvParams: TMDBDiscoverTVParams = {
          sort_by: 'popularity.desc',
          with_genres: genreId,
          'vote_count.gte': 50,
          'vote_average.gte': 6.5,
          page: randomPage(),
        }
        const data = await discoverTVShows({ ...tvParams, page: randomPage() })
        if (!data.results.length) continue
        lastResults = data.results
        const candidates = data.results.filter((m) => !excludeIds.has(m.id))
        if (candidates.length > 0) {
          chosenItem = candidates[Math.floor(Math.random() * Math.min(candidates.length, 10))]
          break
        }
      } else {
        const movieParams: TMDBDiscoverMovieParams = {
          sort_by: 'popularity.desc',
          with_genres: genreId,
          'vote_count.gte': 100,
          'vote_average.gte': 6.5,
          page: randomPage(),
        }
        const data = await discoverMovies({ ...movieParams, page: randomPage() })
        if (!data.results.length) continue
        lastResults = data.results
        const candidates = data.results.filter((m) => !excludeIds.has(m.id))
        if (candidates.length > 0) {
          chosenItem = candidates[Math.floor(Math.random() * Math.min(candidates.length, 10))]
          break
        }
      }
    }

    if (!chosenItem) {
      if (!lastResults.length) {
        return NextResponse.json({ error: 'No results found' }, { status: 404 })
      }
      chosenItem = lastResults[Math.floor(Math.random() * Math.min(lastResults.length, 10))]
    }

    const providers = type === 'tv'
      ? await getTVWatchProviders(chosenItem.id).catch(() => null)
      : await getMovieWatchProviders(chosenItem.id).catch(() => null)

    const item: RecommendationItem = {
      movie: chosenItem,
      providers: providers?.results?.['RU'] ?? null,
    }

    return NextResponse.json({ item })
  } catch (err) {
    console.error('[roulette]', err)
    return NextResponse.json({ error: 'Failed to fetch roulette result' }, { status: 500 })
  }
}
