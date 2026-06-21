import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { fetchAndParsePlaylist } from '@/lib/iptv/fetch-playlist.server'
import { parseM3u } from '@/lib/iptv/parse-m3u'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// GET /api/iptv/[id]/channels
// Прокси: берёт плейлист пользователя, загружает/берёт rawContent, парсит.
// Изолирует браузер от прямых запросов к пользовательскому URL (против CORS).
// Rate-limit защищает от злоупотребления прокси (SSRF amplification).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit(`iptv-channels:${session.user.id}`)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
      }
    )
  }

  const { id } = await params

  const playlist = await prisma.iptvPlaylist.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    let channels
    if (playlist.sourceType === 'file' && playlist.rawContent) {
      channels = parseM3u(playlist.rawContent)
    } else if (playlist.sourceType === 'url' && playlist.sourceUrl) {
      channels = await fetchAndParsePlaylist(playlist.sourceUrl)
    } else {
      return NextResponse.json({ error: 'Playlist source missing' }, { status: 422 })
    }

    return NextResponse.json({ channels })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
