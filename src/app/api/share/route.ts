import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      movieIds: number[]
      mediaType: string
      params: Record<string, unknown>
    }

    if (!Array.isArray(body.movieIds) || body.movieIds.length === 0) {
      return NextResponse.json({ error: 'movieIds required' }, { status: 400 })
    }

    const shared = await prisma.sharedResult.create({
      data: {
        movieIds: body.movieIds,
        mediaType: body.mediaType ?? 'movie',
        params: (body.params ?? {}) as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ id: shared.id })
  } catch {
    return NextResponse.json({ error: 'Failed to create share' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  try {
    const shared = await prisma.sharedResult.findUnique({ where: { id } })
    if (!shared) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(shared)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch share' }, { status: 500 })
  }
}
