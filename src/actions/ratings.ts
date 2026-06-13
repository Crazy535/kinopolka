'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'

interface RatingInput {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  score: number
}

export async function setRating(input: RatingInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (input.score < 1 || input.score > 5) throw new Error('Score must be 1–5')

  const userId = session.user.id

  await prisma.rating.upsert({
    where: {
      userId_tmdbId_mediaType: {
        userId,
        tmdbId: input.tmdbId,
        mediaType: input.mediaType,
      },
    },
    update: { score: input.score },
    create: {
      userId,
      tmdbId: input.tmdbId,
      mediaType: input.mediaType,
      score: input.score,
    },
  })

  return { score: input.score }
}

export async function getUserRating(
  userId: string,
  tmdbId: number,
  mediaType: string,
) {
  const rating = await prisma.rating.findUnique({
    where: {
      userId_tmdbId_mediaType: { userId, tmdbId, mediaType },
    },
  })
  return { score: rating?.score ?? null }
}
