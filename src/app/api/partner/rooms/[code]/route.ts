import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMovieWatchProviders } from '@/lib/tmdb'
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  try {
    const room = await prisma.partnerRoom.findUnique({
      where: { code },
      include: {
        host: { select: { id: true, name: true, image: true } },
        guest: { select: { id: true, name: true, image: true } },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Room expired' }, { status: 410 })
    }

    let items: RecommendationItem[] | null = null
    if (room.status === 'done' && room.resultIds.length > 0) {
      const movieDetails = await Promise.all(room.resultIds.map(fetchMovieById))
      const valid = movieDetails.filter(Boolean)
      const providerResults = await Promise.all(
        valid.map((m) => getMovieWatchProviders(m.id).catch(() => null))
      )
      items = valid.map((movie, i) => ({
        movie,
        providers: providerResults[i]?.results?.['RU'] ?? null,
      }))
    }

    return NextResponse.json({
      code: room.code,
      status: room.status,
      host: room.host,
      guest: room.guest,
      items,
      expiresAt: room.expiresAt,
    })
  } catch (err) {
    console.error('[partner/rooms/[code] GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
