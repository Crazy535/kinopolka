import 'server-only'

import { prisma } from '@/lib/db'
import { getMovieDetails, getTVShowDetails } from '@/lib/tmdb'

export async function updateTasteFromRating(
  userId: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  score: number
): Promise<void> {
  if (score === 3) return

  const details =
    mediaType === 'movie'
      ? await getMovieDetails(tmdbId)
      : await getTVShowDetails(tmdbId)

  const ratedGenreIds = details.genres.map((g) => g.id)
  if (ratedGenreIds.length === 0) return

  const existing = await prisma.tasteProfile.findUnique({
    where: { userId },
    select: { genreIds: true },
  })

  const current = existing?.genreIds ?? []
  const without = current.filter((id) => !ratedGenreIds.includes(id))

  const updated =
    score >= 4
      ? [...ratedGenreIds, ...without]   // boost: move to front
      : [...without, ...ratedGenreIds]   // deprioritize: move to back

  await prisma.tasteProfile.upsert({
    where: { userId },
    create: { userId, genreIds: updated, movieIds: [] },
    update: { genreIds: updated },
  })
}
