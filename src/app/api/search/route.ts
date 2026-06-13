import { NextRequest, NextResponse } from 'next/server'

const TMDB_BASE = 'https://api.themoviedb.org/3'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const token = process.env.TMDB_API_READ_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Missing TMDB token' }, { status: 500 })
  }

  const url = new URL(`${TMDB_BASE}/search/multi`)
  url.searchParams.set('query', q)
  url.searchParams.set('language', 'ru-RU')
  url.searchParams.set('page', '1')
  url.searchParams.set('include_adult', 'false')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'TMDB error' }, { status: 502 })
  }

  const data = (await res.json()) as {
    results: Array<{
      id: number
      media_type: string
      title?: string
      name?: string
      poster_path: string | null
      release_date?: string
      first_air_date?: string
    }>
  }

  const results = data.results
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      media_type: r.media_type as 'movie' | 'tv',
      title: r.title ?? r.name ?? '',
      poster_path: r.poster_path,
      year: (r.release_date ?? r.first_air_date ?? '').slice(0, 4),
    }))

  return NextResponse.json({ results })
}
