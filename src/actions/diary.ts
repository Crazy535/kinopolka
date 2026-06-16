'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

interface LogWatchInput {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  title: string
  posterPath: string | null
  note?: string
  isRewatch?: boolean
  watchedAt?: Date
}

export async function logWatch(input: LogWatchInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const watchedAt = input.watchedAt ?? new Date()

  await prisma.watchLog.create({
    data: {
      userId: session.user.id,
      tmdbId: input.tmdbId,
      mediaType: input.mediaType,
      title: input.title,
      posterPath: input.posterPath,
      note: input.note ?? null,
      isRewatch: input.isRewatch ?? false,
      watchedAt,
    },
  })

  revalidatePath('/diary')
}

export async function removeLog(logId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.watchLog.delete({
    where: { id: logId, userId: session.user.id },
  })

  revalidatePath('/diary')
}

export async function addNote(logId: string, note: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.watchLog.update({
    where: { id: logId, userId: session.user.id },
    data: { note: note.trim() || null },
  })

  revalidatePath('/diary')
}
