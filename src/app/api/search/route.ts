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
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getToken()}` },
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json() as Promise<T>
}

function hasNonLatinCyrillic(str: string): boolean {
  return /[^ -ɏЀ-ӿ\s]/u.test(str)
}

interface TMDBMovieResult {
  id: number
  title: string
  poster_path: string | null
  release_date?: string
  genre_ids?: number[]
  popularity: number
}

interface TMDBTVResult {
  id: number
  name: string
  poster_path: string | null
  first_air_date?: string
  genre_ids?: number[]
  popularity: number
}

interface TMDBMovieSearchResponse {
  results: TMDBMovieResult[]
  total_pages: number
  total_results: number
  page: number
}

interface TMDBTVSearchResponse {
  results: TMDBTVResult[]
  total_pages: number
  total_results: number
  page: number
}

interface TMDBPaginatedResult {
  results: unknown[]
  total_pages: number
  page: number
}

// Fetches /search/movie and /search/tv in parallel for ru-RU and en-US,
// applies English title fallback for non-Latin/Cyrillic titles, and
// returns merged results sorted by popularity descending.
async function searchBothTypes(
  query: string,
  page: string,
  filterType: 'movie' | 'tv' | null
): Promise<{
  movies: Array<{ id: number; media_type: 'movie'; title: string; poster_path: string | null; year: string; genre_ids: number[]; popularity: number }>
  tv: Array<{ id: number; media_type: 'tv'; title: string; poster_path: string | null; year: string; genre_ids: number[]; popularity: number }>
  movieTotalPages: number
  tvTotalPages: number
}> {
  const commonParams = { query, include_adult: 'false', page }

  const fetches: Promise<TMDBMovieSearchResponse | TMDBTVSearchResponse | null>[] = []

  const wantMovies = filterType === null || filterType === 'movie'
  const wantTV = filterType === null || filterType === 'tv'

  if (wantMovies) {
    fetches.push(tmdbGet<TMDBMovieSearchResponse>('/search/movie', { ...commonParams, language: 'ru-RU' }))
    fetches.push(tmdbGet<TMDBMovieSearchResponse>('/search/movie', { ...commonParams, language: 'en-US' }))
  } else {
    fetches.push(Promise.resolve(null))
    fetches.push(Promise.resolve(null))
  }

  if (wantTV) {
    fetches.push(tmdbGet<TMDBTVSearchResponse>('/search/tv', { ...commonParams, language: 'ru-RU' }))
    fetches.push(tmdbGet<TMDBTVSearchResponse>('/search/tv', { ...commonParams, language: 'en-US' }))
  } else {
    fetches.push(Promise.resolve(null))
    fetches.push(Promise.resolve(null))
  }

  const [moviesRu, moviesEn, tvRu, tvEn] = await Promise.all(fetches) as [
    TMDBMovieSearchResponse | null,
    TMDBMovieSearchResponse | null,
    TMDBTVSearchResponse | null,
    TMDBTVSearchResponse | null,
  ]

  const enMovieMap = new Map<number, string>()
  if (moviesEn) {
    for (const m of moviesEn.results) enMovieMap.set(m.id, m.title)
  }

  const enTVMap = new Map<number, string>()
  if (tvEn) {
    for (const s of tvEn.results) enTVMap.set(s.id, s.name)
  }

  const movies = (moviesRu?.results ?? []).map((m) => {
    const ruTitle = m.title
    const title = hasNonLatinCyrillic(ruTitle)
      ? (enMovieMap.get(m.id) ?? ruTitle)
      : ruTitle
    return {
      id: m.id,
      media_type: 'movie' as const,
      title,
      poster_path: m.poster_path,
      year: (m.release_date ?? '').slice(0, 4),
      genre_ids: m.genre_ids ?? [],
      popularity: m.popularity,
    }
  })

  const tvShows = (tvRu?.results ?? []).map((s) => {
    const ruTitle = s.name
    const title = hasNonLatinCyrillic(ruTitle)
      ? (enTVMap.get(s.id) ?? ruTitle)
      : ruTitle
    return {
      id: s.id,
      media_type: 'tv' as const,
      title,
      poster_path: s.poster_path,
      year: (s.first_air_date ?? '').slice(0, 4),
      genre_ids: s.genre_ids ?? [],
      popularity: s.popularity,
    }
  })

  return {
    movies,
    tv: tvShows,
    movieTotalPages: moviesRu ? Math.min(moviesRu.total_pages, 20) : 1,
    tvTotalPages: tvRu ? Math.min(tvRu.total_pages, 20) : 1,
  }
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
    // Dropdown mode: parallel movie+tv search, title fallback, sort by popularity
    if (!full) {
      if (!q || q.length < 2) return NextResponse.json({ results: [] })

      const limit = Math.min(parseInt(sp.get('limit') ?? '8', 10), 20)
      const filterType = type === 'movie' ? 'movie' : type === 'tv' ? 'tv' : null

      const { movies, tv } = await searchBothTypes(q, '1', filterType)

      const merged = [...movies, ...tv]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit)
        .map(({ id, media_type, title, poster_path, year: y, genre_ids }) => ({
          id,
          media_type,
          title,
          poster_path,
          year: y,
          genre_ids,
        }))

      return NextResponse.json({ results: merged })
    }

    // Full search page mode
    let items: unknown[] = []
    let total_pages = 1

    if (q.length >= 2) {
      const filterType = type === 'movie' ? 'movie' : type === 'tv' ? 'tv' : null

      const { movies, tv, movieTotalPages, tvTotalPages } = await searchBothTypes(q, page, filterType)

      if (filterType === 'movie') {
        items = movies
        total_pages = movieTotalPages
      } else if (filterType === 'tv') {
        items = tv
        total_pages = tvTotalPages
      } else {
        items = [...movies, ...tv].sort((a, b) => b.popularity - a.popularity)
        total_pages = Math.max(movieTotalPages, tvTotalPages)
      }

    } else if (genre || year) {
      // Discover mode: no text query but has filters
      const discoverParams: Record<string, string> = {
        language: 'ru-RU',
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
