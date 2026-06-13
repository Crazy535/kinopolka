import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { intersectGenres } from '@/lib/partner-engine'
import { discoverMovies } from '@/lib/tmdb'

export const dynamic = 'force-dynamic'

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

    const body = (await req.json().catch(() => ({}))) as { genreIds?: number[] }

    const room = await prisma.partnerRoom.findUnique({ where: { code } })

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (room.expiresAt < new Date()) return NextResponse.json({ error: 'Room expired' }, { status: 410 })
    if (room.status !== 'waiting') return NextResponse.json({ error: 'Room already has a guest' }, { status: 409 })
    if (room.hostId === session.user.id) return NextResponse.json({ error: 'Cannot join your own room' }, { status: 400 })

    // Guest genre preferences: from body (inline picker) or their TasteProfile
    let guestGenreIds: number[] = body.genreIds ?? []
    if (guestGenreIds.length === 0) {
      const profile = await prisma.tasteProfile.findUnique({
        where: { userId: session.user.id },
      })
      guestGenreIds = profile?.genreIds ?? []
    }

    // Run intersection algorithm
    const sharedGenres = intersectGenres(room.hostGenreIds, guestGenreIds)
    const topGenres = sharedGenres.slice(0, 3).join(',')

    const data = await discoverMovies({
      sort_by: 'popularity.desc',
      with_genres: topGenres,
      'vote_count.gte': 100,
      'vote_average.gte': 6.5,
      page: 1,
    })

    const resultIds = data.results.slice(0, 8).map((m) => m.id)

    await prisma.partnerRoom.update({
      where: { code },
      data: {
        guestId: session.user.id,
        guestGenreIds,
        status: 'done',
        resultIds,
      },
    })

    return NextResponse.json({ status: 'done', resultIds })
  } catch (err) {
    console.error('[partner/rooms/join]', err)
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }
}
