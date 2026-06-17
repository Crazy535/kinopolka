'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function addGenresToTaste(genreIds: number[]): Promise<{ added: number }> {
  if (genreIds.length === 0) return { added: 0 }

  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const userId = session.user.id

  const profile = await prisma.tasteProfile.findUnique({
    where: { userId },
    select: { genreIds: true },
  })

  const existing = profile?.genreIds ?? []
  const newIds = genreIds.filter((id) => !existing.includes(id))
  if (newIds.length === 0) return { added: 0 }

  // Prepend new genre IDs (they become higher priority)
  const updated = [...newIds, ...existing]

  await prisma.tasteProfile.upsert({
    where: { userId },
    create: { userId, genreIds: updated, movieIds: [] },
    update: { genreIds: updated },
  })

  return { added: newIds.length }
}
