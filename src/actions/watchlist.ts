'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

interface WatchlistInput {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  title: string
  posterPath: string | null
}

export async function toggleWatchlist(input: WatchlistInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const userId = session.user.id

  const existing = await prisma.watchlistItem.findUnique({
    where: {
      userId_tmdbId_mediaType: {
        userId,
        tmdbId: input.tmdbId,
        mediaType: input.mediaType,
      },
    },
  })

  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } })
    return { inWatchlist: false }
  }

  await prisma.watchlistItem.create({
    data: {
      userId,
      tmdbId: input.tmdbId,
      mediaType: input.mediaType,
      title: input.title,
      posterPath: input.posterPath,
    },
  })

  return { inWatchlist: true }
}

export async function getWatchlistStatus(
  userId: string,
  tmdbId: number,
  mediaType: string,
) {
  const item = await prisma.watchlistItem.findUnique({
    where: {
      userId_tmdbId_mediaType: { userId, tmdbId, mediaType },
    },
  })
  return { inWatchlist: !!item }
}

export async function markAsWatched(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.watchlistItem.update({
    where: { id, userId: session.user.id },
    data: { watchedAt: new Date() },
  })

  revalidatePath('/watchlist')
}

export async function unmarkAsWatched(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.watchlistItem.update({
    where: { id, userId: session.user.id },
    data: { watchedAt: null },
  })

  revalidatePath('/watchlist')
}
