import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { generateRoomCode, intersectGenres } from '@/lib/partner-engine'
import { discoverMovies } from '@/lib/tmdb'
import { checkAndGrantAchievements } from '@/lib/achievements'

export const dynamic = 'force-dynamic'

// POST — host creates a room.
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { genreIds?: number[] }

    // Use provided genreIds (from inline picker) or fetch from TasteProfile
    let genreIds: number[] = body.genreIds ?? []
    if (genreIds.length === 0) {
      const profile = await prisma.tasteProfile.findUnique({
        where: { userId: session.user.id },
      })
      genreIds = profile?.genreIds ?? []
    }

    // Generate unique code (retry on collision)
    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 5) {
      const exists = await prisma.partnerRoom.findUnique({ where: { code } })
      if (!exists) break
      code = generateRoomCode()
      attempts++
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2h TTL

    const room = await prisma.partnerRoom.create({
      data: {
        code,
        hostId: session.user.id,
        hostGenreIds: genreIds,
        expiresAt,
      },
    })

    checkAndGrantAchievements(session.user.id).catch(() => {})

    return NextResponse.json({ code: room.code, expiresAt: room.expiresAt })
  } catch (err) {
    console.error('[partner/rooms POST]', err)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

// Internal helper — runs intersection + TMDB discover, stores results.
export async function runPartnerRecommendation(roomId: string, hostGenreIds: number[], guestGenreIds: number[]) {
  const genres = intersectGenres(hostGenreIds, guestGenreIds)
  const topGenres = genres.slice(0, 3).join(',')

  const data = await discoverMovies({
    sort_by: 'popularity.desc',
    with_genres: topGenres,
    'vote_count.gte': 100,
    'vote_average.gte': 6.5,
    page: 1,
  })

  const resultIds = data.results.slice(0, 8).map((m) => m.id)

  await prisma.partnerRoom.update({
    where: { id: roomId },
    data: { status: 'done', resultIds },
  })

  return resultIds
}
