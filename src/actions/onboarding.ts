'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

interface SelectedMovie {
  id: number
  genre_ids: number[]
}

export async function saveTasteProfile(selected: SelectedMovie[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Aggregate genre_ids by frequency → take top genres
  const genreCount = new Map<number, number>()
  for (const movie of selected) {
    for (const gid of movie.genre_ids) {
      genreCount.set(gid, (genreCount.get(gid) ?? 0) + 1)
    }
  }

  const genreIds = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id)

  const movieIds = selected.map((m) => m.id)

  await prisma.tasteProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, genreIds, movieIds },
    update: { genreIds, movieIds, updatedAt: new Date() },
  })

  redirect('/')
}
