import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { intersectGenres } from '@/lib/partner-engine'
import { discoverMovies, getMovieWatchProviders } from '@/lib/tmdb'
import type { RecommendationItem } from '@/types/quiz'

export const dynamic = 'force-dynamic'

async function fetchMovieById(id: number) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?language=ru-RU`,
    {
      headers: { Authorization: `Bearer ${process.env.TMDB_API_READ_TOKEN}` },
      next: { revalidate: 3600 },
    }
  )
  if (!res.ok) return null
  return res.json()
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { excludeIds?: number[] }
    const excludeSet = new Set(body.excludeIds ?? [])

    const room = await prisma.partnerRoom.findUnique({ where: { code } })
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (room.expiresAt < new Date()) return NextResponse.json({ error: 'Room expired' }, { status: 410 })
    if (room.status !== 'done') return NextResponse.json({ error: 'Room not ready' }, { status: 400 })
    if (room.hostId !== session.user.id && room.guestId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sharedGenres = intersectGenres(room.hostGenreIds, room.guestGenreIds)
    const topGenres = sharedGenres.slice(0, 3).join(',')

    // Random page (2–9) so each refresh yields different results
    const page = Math.floor(Math.random() * 8) + 2

    const data = await discoverMovies({
      sort_by: 'popularity.desc',
      with_genres: topGenres,
      'vote_count.gte': 100,
      'vote_average.gte': 6.5,
      page,
    })

    const candidateIds = data.results
      .filter((m) => !excludeSet.has(m.id))
      .slice(0, 8)
      .map((m) => m.id)

    const movieDetails = await Promise.all(candidateIds.map(fetchMovieById))
    const valid = movieDetails.filter(Boolean)
    const providerResults = await Promise.all(
      valid.map((m) => getMovieWatchProviders(m.id).catch(() => null))
    )

    const items: RecommendationItem[] = valid.map((movie, i) => ({
      movie,
      providers: providerResults[i]?.results?.['RU'] ?? null,
    }))

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[partner/rooms/[code]/refresh]', err)
    return NextResponse.json({ error: 'Failed to refresh' }, { status: 500 })
  }
}
