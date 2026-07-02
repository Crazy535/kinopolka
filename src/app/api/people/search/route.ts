import { NextResponse } from 'next/server'
import { searchPersons } from '@/lib/tmdb'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const rl = await checkRateLimit(`people:${getClientIp(request)}`)
  if (!rl.success) return rateLimitResponse(rl)

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const data = await searchPersons(query)
    const results = data.results
      .filter((p) => p.known_for_department === 'Acting' || p.known_for_department === 'Directing')
      .slice(0, 6)
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
