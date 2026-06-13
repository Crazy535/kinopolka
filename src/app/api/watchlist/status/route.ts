import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ inWatchlist: false })
  }

  const tmdbId = Number(req.nextUrl.searchParams.get('tmdbId'))
  const mediaType = req.nextUrl.searchParams.get('mediaType') ?? 'movie'

  if (!tmdbId || isNaN(tmdbId)) {
    return NextResponse.json({ inWatchlist: false })
  }

  const item = await prisma.watchlistItem.findUnique({
    where: {
      userId_tmdbId_mediaType: {
        userId: session.user.id,
        tmdbId,
        mediaType,
      },
    },
  })

  return NextResponse.json({ inWatchlist: !!item })
}
