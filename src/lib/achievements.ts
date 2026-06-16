import 'server-only'
import { prisma } from '@/lib/db'

export type BadgeId =
  | 'first_watch'
  | 'cinephile_10'
  | 'genre_master'
  | 'explorer'
  | 'partner'

export interface BadgeDef {
  id: BadgeId
  title: string
  description: string
  condition: string
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first_watch',
    title: 'Первый просмотр',
    description: 'Отметил первый фильм просмотренным',
    condition: 'Посмотри любой фильм или сериал',
  },
  {
    id: 'cinephile_10',
    title: 'Киноман',
    description: '10 фильмов и сериалов просмотрено',
    condition: 'Посмотри 10 фильмов или сериалов',
  },
  {
    id: 'genre_master',
    title: 'Знаток жанров',
    description: 'Вкус определён в 5 жанрах',
    condition: 'Пройди онбординг и выбери 5 жанров',
  },
  {
    id: 'explorer',
    title: 'Исследователь',
    description: 'Добавил 3 режиссёра в избранные',
    condition: 'Добавь 3 режиссёра при онбординге',
  },
  {
    id: 'partner',
    title: 'Партнёр',
    description: 'Провёл совместный сеанс',
    condition: 'Используй Партнёрский режим',
  },
]

export async function checkAndGrantAchievements(userId: string): Promise<BadgeId[]> {
  const [watchedCount, tasteProfile, directorCount, partnerCount] = await Promise.all([
    prisma.watchlistItem.count({ where: { userId, watchedAt: { not: null } } }),
    prisma.tasteProfile.findUnique({ where: { userId }, select: { genreIds: true } }),
    prisma.favoritePerson.count({ where: { userId, role: 'director' } }),
    prisma.partnerRoom.count({ where: { hostId: userId } }),
  ])

  const toGrant: BadgeId[] = []

  if (watchedCount >= 1) toGrant.push('first_watch')
  if (watchedCount >= 10) toGrant.push('cinephile_10')
  if ((tasteProfile?.genreIds.length ?? 0) >= 5) toGrant.push('genre_master')
  if (directorCount >= 3) toGrant.push('explorer')
  if (partnerCount >= 1) toGrant.push('partner')

  if (toGrant.length === 0) return []

  // Upsert all unlocked badges (ignore already-existing ones via skipDuplicates)
  await prisma.userAchievement.createMany({
    data: toGrant.map((badge) => ({ userId, badge })),
    skipDuplicates: true,
  })

  return toGrant
}
