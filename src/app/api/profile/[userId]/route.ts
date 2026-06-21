import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface Params { params: Promise<{ userId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      xp: true,
      level: true,
      createdAt: true,
      tasteProfile: { select: { genreIds: true } },
      achievements: { select: { badge: true } },
      collections: {
        where: { isPublic: true },
        select: {
          id: true,
          title: true,
          description: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ user })
}
