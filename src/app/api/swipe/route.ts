import { NextRequest, NextResponse } from 'next/server'
import { discoverMovies, discoverTVShows } from '@/lib/tmdb'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'
import type { SwipeItem } from '@/components/swipe/swipe-card'

function randomPage(): number {
  return Math.floor(Math.random() * 12) + 1
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(`swipe:${getClientIp(req)}`)
  if (!rl.success) return rateLimitResponse(rl)

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie'
  const genreIdsParam = searchParams.get('genre_ids')
  const excludeIdsParam = searchParams.get('exclude_ids')

  const excludeSet = new Set<number>(
    excludeIdsParam ? excludeIdsParam.split(',').map(Number).filter(Boolean) : []
  )
  const genreIds = genreIdsParam ? genreIdsParam.split(',').filter(Boolean) : []

  try {
    let allItems: (TMDBMovie | TMDBTVShow)[] = []

    if (type === 'movie') {
      if (genreIds.length > 0) {
        const results = await Promise.all(
          genreIds.slice(0, 3).map((gId) =>
            discoverMovies({
              sort_by: 'popularity.desc',
              with_genres: gId,
              'vote_count.gte': 100,
              'vote_average.gte': 6.5,
              page: randomPage(),
            })
          )
        )
        allItems = results.flatMap((r) => r.results)
      } else {
        const [r1, r2] = await Promise.all([
          discoverMovies({
            sort_by: 'popularity.desc',
            'vote_count.gte': 200,
            'vote_average.gte': 6.5,
            page: randomPage(),
          }),
          discoverMovies({
            sort_by: 'vote_average.desc',
            'vote_count.gte': 500,
            'vote_average.gte': 7.0,
            page: randomPage(),
          }),
        ])
        allItems = [...r1.results, ...r2.results]
      }
    } else {
      if (genreIds.length > 0) {
        const results = await Promise.all(
          genreIds.slice(0, 3).map((gId) =>
            discoverTVShows({
              sort_by: 'popularity.desc',
              with_genres: gId,
              'vote_count.gte': 50,
              'vote_average.gte': 6.5,
              page: randomPage(),
            })
          )
        )
        allItems = results.flatMap((r) => r.results)
      } else {
        const [r1, r2] = await Promise.all([
          discoverTVShows({
            sort_by: 'popularity.desc',
            'vote_count.gte': 100,
            'vote_average.gte': 6.5,
            page: randomPage(),
          }),
          discoverTVShows({
            sort_by: 'vote_average.desc',
            'vote_count.gte': 200,
            'vote_average.gte': 7.0,
            page: randomPage(),
          }),
        ])
        allItems = [...r1.results, ...r2.results]
      }
    }

    // Deduplicate, require poster, exclude seen
    const seen = new Set<number>()
    const filtered = allItems.filter((m) => {
      if (excludeSet.has(m.id) || seen.has(m.id) || !m.poster_path) return false
      seen.add(m.id)
      return true
    })

    const items: SwipeItem[] = shuffle(filtered)
      .slice(0, 12)
      .map((m) => ({ movie: m, mediaType: type }))

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[swipe]', err)
    return NextResponse.json({ error: 'Failed to fetch swipe items' }, { status: 500 })
  }
}
