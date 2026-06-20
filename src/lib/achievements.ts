import 'server-only'
import { prisma } from '@/lib/db'

export type BadgeId =
  | 'first_watch'
  | 'cinephile_10'
  | 'cinephile_25'
  | 'cinephile_50'
  | 'cinephile_100'
  | 'genre_master'
  | 'genre_all'
  | 'explorer'
  | 'director_fan'
  | 'partner'
  | 'partner_veteran'
  | 'collector'
  | 'mega_collector'
  | 'watchlist_addict'
  | 'critic'
  | 'movie_critic'
  | 'perfectionist'
  | 'harsh_critic'
  | 'diary_keeper'
  | 'taste_defined'

export interface BadgeDef {
  id: BadgeId
  title: string
  description: string
  condition: string
  xp: number
  category: 'watch' | 'taste' | 'social' | 'collection' | 'rating' | 'diary'
}

export const BADGES: BadgeDef[] = [
  // Watch milestones
  { id: 'first_watch',      title: 'Первый просмотр',    description: 'Отметил первый фильм просмотренным',     condition: 'Посмотри любой фильм или сериал',          xp: 50,  category: 'watch' },
  { id: 'cinephile_10',     title: 'Киноман',             description: '10 фильмов и сериалов просмотрено',      condition: 'Посмотри 10 фильмов или сериалов',          xp: 100, category: 'watch' },
  { id: 'cinephile_25',     title: 'Любитель кино',       description: '25 фильмов и сериалов просмотрено',      condition: 'Посмотри 25 фильмов или сериалов',          xp: 200, category: 'watch' },
  { id: 'cinephile_50',     title: 'Кинофил',             description: '50 фильмов и сериалов просмотрено',      condition: 'Посмотри 50 фильмов или сериалов',          xp: 350, category: 'watch' },
  { id: 'cinephile_100',    title: 'Мастер экрана',       description: '100 фильмов и сериалов просмотрено',     condition: 'Посмотри 100 фильмов или сериалов',         xp: 600, category: 'watch' },
  // Taste & discovery
  { id: 'taste_defined',    title: 'Знаю свой вкус',      description: 'Заполнил вкусовой профиль',              condition: 'Пройди онбординг',                          xp: 50,  category: 'taste' },
  { id: 'genre_master',     title: 'Знаток жанров',       description: 'Вкус определён в 5 жанрах',              condition: 'Пройди онбординг и выбери 5 жанров',        xp: 75,  category: 'taste' },
  { id: 'genre_all',        title: 'Всеядный зритель',    description: 'Вкус определён в 10 жанрах',             condition: 'Добавь 10 жанров в профиль',                xp: 150, category: 'taste' },
  { id: 'explorer',         title: 'Исследователь',       description: 'Добавил 3 режиссёра в избранные',        condition: 'Добавь 3 режиссёра при онбординге',        xp: 75,  category: 'taste' },
  { id: 'director_fan',     title: 'Знаток режиссуры',    description: 'Добавил 5 режиссёров в избранные',       condition: 'Добавь 5 режиссёров в профиль',            xp: 150, category: 'taste' },
  // Social
  { id: 'partner',          title: 'Партнёр',             description: 'Провёл совместный сеанс',                condition: 'Используй Партнёрский режим',               xp: 100, category: 'social' },
  { id: 'partner_veteran',  title: 'Ветеран вечеринок',   description: '5 совместных сеансов проведено',         condition: 'Проведи 5 партнёрских сеансов',            xp: 200, category: 'social' },
  // Watchlist / collection
  { id: 'collector',        title: 'Коллекционер',        description: '10 фильмов добавлено в вотчлист',        condition: 'Добавь 10 фильмов в вотчлист',             xp: 75,  category: 'collection' },
  { id: 'mega_collector',   title: 'Мега-коллекционер',   description: '50 фильмов в вотчлисте',                 condition: 'Добавь 50 фильмов в вотчлист',             xp: 200, category: 'collection' },
  { id: 'watchlist_addict', title: 'Архивариус',          description: '100 фильмов в вотчлисте',                condition: 'Добавь 100 фильмов в вотчлист',            xp: 400, category: 'collection' },
  // Ratings
  { id: 'critic',           title: 'Критик',              description: '5 оценок поставлено',                    condition: 'Оцени 5 фильмов',                          xp: 75,  category: 'rating' },
  { id: 'movie_critic',     title: 'Кинокритик',          description: '20 оценок поставлено',                   condition: 'Оцени 20 фильмов',                         xp: 175, category: 'rating' },
  { id: 'perfectionist',    title: 'Перфекционист',       description: 'Поставил оценку 5 звёзд',                condition: 'Поставь кому-нибудь 5 звёзд',             xp: 50,  category: 'rating' },
  { id: 'harsh_critic',     title: 'Суровый критик',      description: 'Поставил оценку 1 звезда',               condition: 'Поставь кому-нибудь 1 звезду',            xp: 25,  category: 'rating' },
  // Diary
  { id: 'diary_keeper',     title: 'Хроникёр',            description: '5 записей в дневнике с заметкой',        condition: 'Добавь 5 заметок в дневник просмотров',   xp: 100, category: 'diary' },
]

export const BADGE_XP: Record<BadgeId, number> = Object.fromEntries(
  BADGES.map((b) => [b.id, b.xp])
) as Record<BadgeId, number>

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1200, 2000, 3200]

export function getLevelFromXp(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getXpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
}

export function getXpForCurrentLevel(level: number): number {
  return LEVEL_THRESHOLDS[level - 1] ?? 0
}

export async function checkAndGrantAchievements(userId: string): Promise<BadgeId[]> {
  const [watchedCount, watchlistCount, tasteProfile, directorCount, partnerCount, ratingsCount, score5Count, score1Count, diaryWithNoteCount, existingAchievements] = await Promise.all([
    prisma.watchlistItem.count({ where: { userId, watchedAt: { not: null } } }),
    prisma.watchlistItem.count({ where: { userId } }),
    prisma.tasteProfile.findUnique({ where: { userId }, select: { genreIds: true } }),
    prisma.favoritePerson.count({ where: { userId, role: 'director' } }),
    prisma.partnerRoom.count({ where: { OR: [{ hostId: userId }, { guestId: userId }] } }),
    prisma.rating.count({ where: { userId } }),
    prisma.rating.count({ where: { userId, score: 5 } }),
    prisma.rating.count({ where: { userId, score: 1 } }),
    prisma.watchLog.count({ where: { userId, note: { not: null } } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { badge: true } }),
  ])

  const alreadyUnlocked = new Set(existingAchievements.map((a) => a.badge))
  const genreCount = tasteProfile?.genreIds.length ?? 0

  const eligible: BadgeId[] = []
  if (watchedCount >= 1)    eligible.push('first_watch')
  if (watchedCount >= 10)   eligible.push('cinephile_10')
  if (watchedCount >= 25)   eligible.push('cinephile_25')
  if (watchedCount >= 50)   eligible.push('cinephile_50')
  if (watchedCount >= 100)  eligible.push('cinephile_100')
  if (tasteProfile)         eligible.push('taste_defined')
  if (genreCount >= 5)      eligible.push('genre_master')
  if (genreCount >= 10)     eligible.push('genre_all')
  if (directorCount >= 3)   eligible.push('explorer')
  if (directorCount >= 5)   eligible.push('director_fan')
  if (partnerCount >= 1)    eligible.push('partner')
  if (partnerCount >= 5)    eligible.push('partner_veteran')
  if (watchlistCount >= 10)  eligible.push('collector')
  if (watchlistCount >= 50)  eligible.push('mega_collector')
  if (watchlistCount >= 100) eligible.push('watchlist_addict')
  if (ratingsCount >= 5)    eligible.push('critic')
  if (ratingsCount >= 20)   eligible.push('movie_critic')
  if (score5Count >= 1)     eligible.push('perfectionist')
  if (score1Count >= 1)     eligible.push('harsh_critic')
  if (diaryWithNoteCount >= 5) eligible.push('diary_keeper')

  const newBadges = eligible.filter((b) => !alreadyUnlocked.has(b))
  if (newBadges.length === 0) return []

  const earnedXp = newBadges.reduce((sum, b) => sum + (BADGE_XP[b] ?? 0), 0)

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } })
  const currentXp = user?.xp ?? 0
  const newXp = currentXp + earnedXp
  const newLevel = getLevelFromXp(newXp)

  await prisma.$transaction([
    prisma.userAchievement.createMany({
      data: newBadges.map((badge) => ({ userId, badge })),
      skipDuplicates: true,
    }),
    prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel },
    }),
  ])

  return newBadges
}
