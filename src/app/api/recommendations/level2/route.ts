import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { discoverMovies, getMovieWatchProviders } from '@/lib/tmdb'
import type { RecommendationItem } from '@/types/quiz'

export const dynamic = 'force-dynamic'

function randomPage(): number {
  return Math.floor(Math.random() * 3) + 1
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.tasteProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile || profile.genreIds.length === 0) {
      return NextResponse.json({ error: 'No taste profile' }, { status: 404 })
    }

    // Top 3 genres weighted by frequency in selection
    const topGenres = profile.genreIds.slice(0, 3).join(',')

    const data = await discoverMovies({
      sort_by: 'popularity.desc',
      with_genres: topGenres,
      'vote_count.gte': 50,
      'vote_average.gte': 6.0,
      page: randomPage(),
    })

    // Filter out movies the user already selected during onboarding
    const seen = new Set(profile.movieIds)
    const candidates = data.results
      .filter((m) => !seen.has(m.id))
      .slice(0, 5)

    const providerResults = await Promise.all(
      candidates.map((m) => getMovieWatchProviders(m.id).catch(() => null))
    )

    const items: RecommendationItem[] = candidates.map((movie, i) => ({
      movie,
      providers: providerResults[i]?.results?.['RU'] ?? null,
    }))

    return NextResponse.json({ items, genreIds: profile.genreIds })
  } catch (err) {
    console.error('[recommendations/level2]', err)
    return NextResponse.json({ error: 'Failed to fetch personalized recommendations' }, { status: 500 })
  }
}
