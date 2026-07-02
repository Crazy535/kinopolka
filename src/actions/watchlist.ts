'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { checkAndGrantAchievements } from '@/lib/achievements'

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

  const watchedAt = new Date()

  const item = await prisma.watchlistItem.update({
    where: { id, userId: session.user.id },
    data: { watchedAt },
  })

  // Mirror to diary. Уникальный ключ WatchLog включает watchedAt (timestamp),
  // поэтому snap-mark → unmark → re-mark создал бы дубль записи с другим временем.
  // Дедуп по (userId, tmdbId, mediaType) среди обычных (не-rewatch) записей:
  // одна отметка «просмотрено» = одна запись дневника. Повторные просмотры
  // добавляются отдельным потоком (logWatch с isRewatch), не через этот путь.
  const existingLog = await prisma.watchLog.findFirst({
    where: {
      userId: session.user.id,
      tmdbId: item.tmdbId,
      mediaType: item.mediaType,
      isRewatch: false,
    },
    select: { id: true },
  })

  if (!existingLog) {
    try {
      await prisma.watchLog.create({
        data: {
          userId: session.user.id,
          tmdbId: item.tmdbId,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          watchedAt,
        },
      })
    } catch {
      // гонка: параллельный запрос успел вставить — нарушение unique, безопасно игнорируем
    }
  }

  revalidatePath('/watchlist')
  revalidatePath('/diary')

  // Grant achievements async — never block the UI
  checkAndGrantAchievements(session.user.id).catch(() => {})
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
