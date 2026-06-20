import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      items: { orderBy: { addedAt: 'desc' } },
      user: { select: { name: true } },
    },
  })

  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!collection.isPublic && collection.userId !== session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ collection })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  if (typeof body.title === 'string') data.title = body.title.trim()
  if (typeof body.description === 'string') data.description = body.description.trim() || null
  if (typeof body.isPublic === 'boolean') data.isPublic = body.isPublic

  const updated = await prisma.collection.update({ where: { id }, data })
  return NextResponse.json({ collection: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.collection.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
