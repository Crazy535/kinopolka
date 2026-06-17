import { NextRequest, NextResponse } from 'next/server'

const TMDB_BASE = 'https://api.themoviedb.org/3'

function getToken(): string {
  const token = process.env.TMDB_API_READ_TOKEN
  if (!token) throw new Error('Missing TMDB token')
  return token
}

async function tmdbGet<T>(
  path: string,
  params: Record<string, string>,
  revalidate = 60
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('language', 'ru-RU')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getToken()}` },
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json() as Promise<T>
}

interface TMDBPaginatedResult {
  results: unknown[]
  total_pages: number
  page: number
}

// Dropdown search (search-bar.tsx): GET /api/search?q=...
// Full page search: GET /api/search?q=...&type=movie&genre=28&year=2023&page=2&full=1
// Discover (no query): GET /api/search?type=movie&genre=28&year=2023&page=1&full=1
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() ?? ''
  const type = sp.get('type') ?? ''
  const genre = sp.get('genre') ?? ''
  const year = sp.get('year') ?? ''
  const page = sp.get('page') ?? '1'
  const full = sp.get('full') === '1'

  const token = process.env.TMDB_API_READ_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Missing TMDB token' }, { status: 500 })
  }

  try {
    // Dropdown mode: fast multi-search, no filters, configurable limit (default 8, max 20)
    if (!full) {
      if (!q || q.length < 2) return NextResponse.json({ results: [] })

      const limit = Math.min(parseInt(sp.get('limit') ?? '8', 10), 20)

      const data = await tmdbGet<{
        results: Array<{
          id: number; media_type: string; title?: string; name?: string
          poster_path: string | null; release_date?: string; first_air_date?: string
          genre_ids?: number[]
        }>
      }>('/search/multi', { query: q, include_adult: 'false', page: '1' })

      const results = data.results
        .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
        .slice(0, limit)
        .map((r) => ({
          id: r.id,
          media_type: r.media_type as 'movie' | 'tv',
          title: r.title ?? r.name ?? '',
          poster_path: r.poster_path,
          year: (r.release_date ?? r.first_air_date ?? '').slice(0, 4),
          genre_ids: r.genre_ids ?? [],
        }))

      return NextResponse.json({ results })
    }

    // Full search page mode
    let items: unknown[] = []
    let total_pages = 1

    if (q.length >= 2) {
      // Text search via /search/multi, then filter by type
      const filterType = type === 'movie' ? 'movie' : type === 'tv' ? 'tv' : null

      const data = await tmdbGet<TMDBPaginatedResult>('/search/multi', {
        query: q,
        include_adult: 'false',
        page,
      })
      total_pages = Math.min(data.total_pages, 20)

      const mediaResults = (data.results as Array<{ media_type: string; poster_path: string | null }>)
        .filter((r) => {
          if (filterType) return r.media_type === filterType
          return r.media_type === 'movie' || r.media_type === 'tv'
        })

      items = mediaResults

    } else if (genre || year) {
      // Discover mode: no text query but has filters
      const discoverParams: Record<string, string> = {
        sort_by: 'popularity.desc',
        include_adult: 'false',
        page,
      }
      if (genre) discoverParams.with_genres = genre
      if (year) {
        if (type === 'tv') {
          discoverParams['first_air_date.gte'] = `${year}-01-01`
          discoverParams['first_air_date.lte'] = `${year}-12-31`
        } else {
          discoverParams['primary_release_date.gte'] = `${year}-01-01`
          discoverParams['primary_release_date.lte'] = `${year}-12-31`
        }
      }
      discoverParams['vote_count.gte'] = type === 'tv' ? '50' : '100'

      const endpoint = type === 'tv' ? '/discover/tv' : '/discover/movie'
      const mt = type === 'tv' ? 'tv' : 'movie'

      const data = await tmdbGet<TMDBPaginatedResult>(endpoint, discoverParams)
      total_pages = Math.min(data.total_pages, 20)
      items = (data.results as Array<{ poster_path: string | null }>)
        .map((r) => ({ ...r, media_type: mt }))

    }

    return NextResponse.json({
      items,
      total_pages,
      page: parseInt(page, 10),
    })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 502 })
  }
}
