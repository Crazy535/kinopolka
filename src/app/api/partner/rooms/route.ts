import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { generateRoomCode } from '@/lib/partner-engine'
import { checkAndGrantAchievements } from '@/lib/achievements'

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

    // Limit active rooms per host
    const activeRooms = await prisma.partnerRoom.count({
      where: {
        hostId: session.user.id,
        expiresAt: { gt: new Date() },
        status: { not: 'done' },
      },
    })
    if (activeRooms >= 5) {
      return NextResponse.json({ error: 'Max 5 active rooms allowed' }, { status: 409 })
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
