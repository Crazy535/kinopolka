import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    include: { items: { orderBy: { addedAt: 'desc' }, take: 4 } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ collections })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const title = String(body.title ?? '').trim()
  const description = body.description ? String(body.description).trim() : undefined
  const isPublic = Boolean(body.isPublic)

  if (!title || title.length > 100) {
    return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
  }

  const collection = await prisma.collection.create({
    data: { userId: session.user.id, title, description, isPublic },
  })

  return NextResponse.json({ collection }, { status: 201 })
}
