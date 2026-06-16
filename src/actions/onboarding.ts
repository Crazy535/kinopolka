'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { checkAndGrantAchievements } from '@/lib/achievements'

interface SelectedMovie {
  id: number
  genre_ids: number[]
}

interface SelectedPerson {
  tmdbId: number
  name: string
  role: 'actor' | 'director'
  profilePath: string | null
}

export async function saveTasteProfile(selected: SelectedMovie[]) {
  await completeOnboarding(selected, [])
}

export async function completeOnboarding(
  selected: SelectedMovie[],
  people: SelectedPerson[]
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

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
    where: { userId },
    create: { userId, genreIds, movieIds },
    update: { genreIds, movieIds, updatedAt: new Date() },
  })

  if (people.length > 0) {
    await prisma.favoritePerson.deleteMany({ where: { userId } })
    await prisma.favoritePerson.createMany({
      data: people.map((p) => ({
        userId,
        tmdbId: p.tmdbId,
        name: p.name,
        role: p.role,
        profilePath: p.profilePath,
      })),
    })
  }

  await checkAndGrantAchievements(userId).catch(() => {})

  redirect('/')
}
