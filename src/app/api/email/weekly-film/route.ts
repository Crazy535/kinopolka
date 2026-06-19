import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTrendingMovies, getMovieWatchProviders } from '@/lib/tmdb'
import { sendWeeklyFilmEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const trending = await getTrendingMovies('week')
    const movie = trending.results.find((m) => m.poster_path) ?? trending.results[0]

    if (!movie) {
      return NextResponse.json({ error: 'No trending movie found' }, { status: 404 })
    }

    const providers = await getMovieWatchProviders(movie.id).catch(() => null)
    const ruProviders = providers?.results?.['RU'] ?? null

    const users = await prisma.user.findMany({
      where: { emailVerified: { not: null }, emailUnsubscribed: false },
      select: { email: true },
    })

    let sent = 0
    let errors = 0

    for (let i = 0; i < users.length; i += 10) {
      const batch = users.slice(i, i + 10)
      await Promise.all(
        batch.map((u) =>
          sendWeeklyFilmEmail(u.email, movie, ruProviders).then(() => { sent++ }).catch(() => { errors++ })
        )
      )
      if (i + 10 < users.length) {
        await new Promise((r) => setTimeout(r, 100))
      }
    }

    return NextResponse.json({ sent, errors, movie: movie.title })
  } catch (err) {
    console.error('[weekly-film]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
