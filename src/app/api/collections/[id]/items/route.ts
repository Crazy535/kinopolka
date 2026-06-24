import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const tmdbId = Number(body.tmdbId)
  const mediaType = String(body.mediaType ?? 'movie')
  const title = String(body.title ?? '').trim()
  const posterPath = body.posterPath ? String(body.posterPath) : null

  if (!tmdbId || !title || !['movie', 'tv'].includes(mediaType)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const itemCount = await prisma.collectionItem.count({ where: { collectionId: id } })
  if (itemCount >= 500) {
    return NextResponse.json({ error: 'Collection limit is 500 items' }, { status: 409 })
  }

  const item = await prisma.collectionItem.upsert({
    where: { collectionId_tmdbId_mediaType: { collectionId: id, tmdbId, mediaType } },
    create: { collectionId: id, tmdbId, mediaType, title, posterPath },
    update: {},
  })

  await prisma.collection.update({ where: { id }, data: { updatedAt: new Date() } })

  return NextResponse.json({ item }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const tmdbId = Number(body.tmdbId)
  const mediaType = String(body.mediaType ?? 'movie')

  await prisma.collectionItem.deleteMany({
    where: { collectionId: id, tmdbId, mediaType },
  })

  return NextResponse.json({ ok: true })
}
