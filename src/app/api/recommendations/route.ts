import { NextRequest, NextResponse } from 'next/server'
import {
  discoverMovies,
  discoverTVShows,
  getMovieWatchProviders,
  getTVWatchProviders,
} from '@/lib/tmdb'
import type { TMDBDiscoverMovieParams, TMDBDiscoverTVParams, TMDBMovie, TMDBTVShow } from '@/types/tmdb'
import type { ContentType, RuntimeOption, RecommendationItem } from '@/types/quiz'

function randomPage(): number {
  return Math.floor(Math.random() * 8) + 1
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

function rankByGenres<T extends { id: number; genre_ids?: number[] }>(
  items: T[],
  excludeSet: Set<number>,
  preferredGenres: Set<number>,
  count = 5
): T[] {
  const seen = new Set<number>()
  const candidates = items.filter((m) => {
    if (excludeSet.has(m.id) || seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
  if (preferredGenres.size === 0) return pickRandom(candidates.length >= count ? candidates : items, count)
  const scored = candidates.map((m) => ({
    m,
    score: (m.genre_ids ?? []).filter((g) => preferredGenres.has(g)).length,
  }))
  scored.sort((a, b) => b.score - a.score)
  const ranked = scored.slice(0, count).map((s) => s.m)
  if (ranked.length < count) {
    const extra = candidates.filter((m) => !ranked.find((r) => r.id === m.id))
    return [...ranked, ...extra].slice(0, count)
  }
  return ranked
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') as ContentType | null
    const genreId = searchParams.get('genre_id')
    const runtime = searchParams.get('runtime') as RuntimeOption | null
    const excludeIdsParam = searchParams.get('exclude_ids')
    const userGenreIdsParam = searchParams.get('user_genre_ids')

    const excludeSet = new Set<number>(
      excludeIdsParam ? excludeIdsParam.split(',').map(Number).filter(Boolean) : []
    )
    const preferredGenres = new Set<number>(
      userGenreIdsParam ? userGenreIdsParam.split(',').map(Number).filter(Boolean) : []
    )

    if (!type || !genreId) {
      return NextResponse.json({ error: 'Missing required params: type, genre_id' }, { status: 400 })
    }

    const isPersonalized = preferredGenres.size > 0
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

      if (isPersonalized) {
        const [page1, page2] = await Promise.all([
          discoverMovies({ ...params, page: randomPage() }),
          discoverMovies({ ...params, page: randomPage() }),
        ])
        rawItems = rankByGenres([...page1.results, ...page2.results], excludeSet, preferredGenres)
      } else {
        const data = await discoverMovies(params)
        const filtered = data.results.filter((m) => !excludeSet.has(m.id))
        rawItems = pickRandom(filtered.length >= 5 ? filtered : data.results, 5)
      }
    } else {
      const params: TMDBDiscoverTVParams = {
        sort_by: 'popularity.desc',
        with_genres: genreId,
        'vote_count.gte': 50,
        'vote_average.gte': 6.5,
        page: randomPage(),
      }

      if (isPersonalized) {
        const [page1, page2] = await Promise.all([
          discoverTVShows({ ...params, page: randomPage() }),
          discoverTVShows({ ...params, page: randomPage() }),
        ])
        rawItems = rankByGenres([...page1.results, ...page2.results], excludeSet, preferredGenres)
      } else {
        const data = await discoverTVShows(params)
        const filtered = data.results.filter((m) => !excludeSet.has(m.id))
        rawItems = pickRandom(filtered.length >= 5 ? filtered : data.results, 5)
      }
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
