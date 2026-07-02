import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/db'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const MAX_MOVIE_IDS = 20
const MAX_PARAMS_BYTES = 2048

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(`share:${getClientIp(req)}`)
  if (!rl.success) return rateLimitResponse(rl)

  try {
    const body = (await req.json()) as {
      movieIds: unknown
      mediaType?: unknown
      params?: unknown
    }

    if (!Array.isArray(body.movieIds) || body.movieIds.length === 0) {
      return NextResponse.json({ error: 'movieIds required' }, { status: 400 })
    }
    if (body.movieIds.length > MAX_MOVIE_IDS) {
      return NextResponse.json({ error: 'Too many movieIds' }, { status: 422 })
    }
    // Все элементы — целые положительные числа (защита от мусора в БД).
    const movieIds = body.movieIds
    if (!movieIds.every((n) => Number.isInteger(n) && (n as number) > 0)) {
      return NextResponse.json({ error: 'Invalid movieIds' }, { status: 400 })
    }

    const mediaType = body.mediaType === 'tv' ? 'tv' : 'movie'

    const params = body.params && typeof body.params === 'object' ? body.params : {}
    if (JSON.stringify(params).length > MAX_PARAMS_BYTES) {
      return NextResponse.json({ error: 'params too large' }, { status: 422 })
    }

    const shared = await prisma.sharedResult.create({
      data: {
        movieIds: movieIds as number[],
        mediaType,
        params: params as Prisma.InputJsonValue,
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
