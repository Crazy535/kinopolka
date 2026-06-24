import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { parseM3u } from '@/lib/iptv/parse-m3u'

export const dynamic = 'force-dynamic'

const MAX_RAW_BYTES = 10 * 1024 * 1024 // 10 МБ для rawContent

// GET — список плейлистов пользователя (без rawContent для экономии трафика)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const playlists = await prisma.iptvPlaylist.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, sourceType: true, sourceUrl: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ playlists })
}

const MAX_PLAYLISTS_PER_USER = 20

// POST — создать плейлист: { name, sourceType:'url'|'file', sourceUrl?, rawContent? }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const count = await prisma.iptvPlaylist.count({ where: { userId: session.user.id } })
  if (count >= MAX_PLAYLISTS_PER_USER) {
    return NextResponse.json({ error: `Max ${MAX_PLAYLISTS_PER_USER} playlists allowed` }, { status: 409 })
  }

  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > MAX_RAW_BYTES + 2048) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const body = await req.json().catch(() => ({}))
  const name = String(body.name ?? '').trim()
  const sourceType = String(body.sourceType ?? '')

  if (!name || name.length > 200) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }
  if (sourceType !== 'url' && sourceType !== 'file') {
    return NextResponse.json({ error: 'Invalid sourceType' }, { status: 400 })
  }

  let sourceUrl: string | undefined
  let rawContent: string | undefined

  if (sourceType === 'url') {
    const raw = String(body.sourceUrl ?? '').trim()
    try {
      const url = new URL(raw)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error()
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    sourceUrl = raw
  } else {
    rawContent = String(body.rawContent ?? '').trim()
    if (!rawContent || Buffer.byteLength(rawContent, 'utf8') > MAX_RAW_BYTES) {
      return NextResponse.json({ error: 'Invalid rawContent' }, { status: 400 })
    }
    // Быстрая валидация: должен быть хотя бы один канал
    if (parseM3u(rawContent).length === 0) {
      return NextResponse.json({ error: 'No valid channels found in playlist' }, { status: 422 })
    }
  }

  const playlist = await prisma.iptvPlaylist.create({
    data: {
      userId: session.user.id,
      name,
      sourceType,
      sourceUrl: sourceUrl ?? null,
      rawContent: rawContent ?? null,
    },
    select: { id: true, name: true, sourceType: true, sourceUrl: true, createdAt: true },
  })

  return NextResponse.json({ playlist }, { status: 201 })
}

// DELETE — удалить плейлист: { id }
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id = String(body.id ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const existing = await prisma.iptvPlaylist.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.iptvPlaylist.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
