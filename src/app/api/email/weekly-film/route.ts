import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTrendingMovies, getMovieWatchProviders, discoverMovies } from '@/lib/tmdb'
import { withTmdbCache } from '@/lib/tmdb-cache'
import { sendWeeklyFilmEmail } from '@/lib/email'
import type { TMDBMovie } from '@/types/tmdb'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const GENRE_NAMES: Record<number, string> = {
  28: 'Боевик', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия',
  80: 'Криминал', 99: 'Документальный', 18: 'Драма', 10751: 'Семейный',
  14: 'Фэнтези', 36: 'История', 27: 'Ужасы', 10402: 'Музыка',
  9648: 'Мистика', 10749: 'Мелодрама', 878: 'Фантастика', 53: 'Триллер',
  10752: 'Война', 37: 'Вестерн',
}

async function getMovieForGenre(genreId: number): Promise<TMDBMovie | null> {
  return withTmdbCache(`weekly-genre-${genreId}`, async () => {
    const data = await discoverMovies({ with_genres: String(genreId), sort_by: 'popularity.desc', page: 1, 'vote_count.gte': 200 })
    return data.results.find((m: TMDBMovie) => m.poster_path) ?? data.results[0] ?? null
  }, 86400)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fallback: trending movie for users without taste profile
    const trending = await getTrendingMovies('week')
    const trendingMovie = trending.results.find((m) => m.poster_path) ?? trending.results[0]
    if (!trendingMovie) {
      return NextResponse.json({ error: 'No trending movie found' }, { status: 404 })
    }

    // Fetch all subscribable users with their top genre
    const users = await prisma.user.findMany({
      where: { emailVerified: { not: null }, emailUnsubscribed: false },
      select: {
        email: true,
        tasteProfile: { select: { genreIds: true } },
      },
    })

    // Group by top genre ID
    const genreGroups = new Map<number | null, string[]>()
    for (const u of users) {
      const topGenre = u.tasteProfile?.genreIds[0] ?? null
      const bucket = genreGroups.get(topGenre) ?? []
      bucket.push(u.email)
      genreGroups.set(topGenre, bucket)
    }

    // Pre-fetch one movie per genre (parallel, cached)
    const genreIds = Array.from(genreGroups.keys()).filter((g): g is number => g !== null)
    const genreMovieMap = new Map<number, TMDBMovie>()
    await Promise.all(
      genreIds.map(async (gId) => {
        const movie = await getMovieForGenre(gId).catch(() => null)
        if (movie) genreMovieMap.set(gId, movie)
      })
    )

    // Pre-fetch providers per unique movie (parallel, cached)
    const movieIds = new Set<number>([trendingMovie, ...genreMovieMap.values()].map((m) => m.id))
    const providerMap = new Map<number, Awaited<ReturnType<typeof getMovieWatchProviders>>>()
    await Promise.all(
      Array.from(movieIds).map(async (id) => {
        const p = await getMovieWatchProviders(id).catch(() => null)
        if (p) providerMap.set(id, p)
      })
    )

    let sent = 0
    let errors = 0

    // Send emails per group
    for (const [genreId, emails] of genreGroups) {
      const movie = genreId !== null ? (genreMovieMap.get(genreId) ?? trendingMovie) : trendingMovie
      const providers = providerMap.get(movie.id) ?? null
      const ruProviders = providers?.results?.['RU'] ?? null
      const genreName = genreId !== null ? GENRE_NAMES[genreId] : undefined

      for (let i = 0; i < emails.length; i += 10) {
        const batch = emails.slice(i, i + 10)
        await Promise.all(
          batch.map((email) =>
            sendWeeklyFilmEmail(email, movie, ruProviders, genreName)
              .then(() => { sent++ })
              .catch(() => { errors++ })
          )
        )
        if (i + 10 < emails.length) await new Promise((r) => setTimeout(r, 100))
      }
    }

    return NextResponse.json({ sent, errors, groups: genreGroups.size })
  } catch (err) {
    console.error('[weekly-film]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
