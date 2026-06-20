import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { User, Bookmark, Star, Film, Eye } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getPosterUrl } from '@/lib/tmdb-image'
import { AchievementsSection } from '@/components/profile/achievements-section'
import { ReferralSection } from '@/components/profile/referral-section'
import { AiRecommender } from '@/components/ai-recommender'
import type { BadgeId } from '@/lib/achievements'
import { getXpForCurrentLevel, getXpForNextLevel } from '@/lib/achievements'

export const dynamic = 'force-dynamic'

const GENRE_NAMES: Record<number, string> = {
  28: 'Боевик',
  12: 'Приключения',
  16: 'Мультфильм',
  35: 'Комедия',
  80: 'Криминал',
  99: 'Документальный',
  18: 'Драма',
  10751: 'Семейный',
  14: 'Фэнтези',
  36: 'История',
  27: 'Ужасы',
  10402: 'Музыка',
  9648: 'Мистика',
  10749: 'Мелодрама',
  878: 'Фантастика',
  10770: 'ТВ фильм',
  53: 'Триллер',
  10752: 'Война',
  37: 'Вестерн',
  10759: 'Экшн и приключения',
  10762: 'Детский',
  10763: 'Новости',
  10764: 'Реалити',
  10765: 'Sci-Fi и фэнтези',
  10766: 'Мыльная опера',
  10767: 'Ток-шоу',
  10768: 'Война и политика',
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const userId = session.user.id

  const [watchlistCount, watchedCount, ratingsCount, tasteProfile, watchedItems, userAchievements, userXpData] = await Promise.all([
    prisma.watchlistItem.count({ where: { userId, watchedAt: null } }),
    prisma.watchlistItem.count({ where: { userId, watchedAt: { not: null } } }),
    prisma.rating.count({ where: { userId } }),
    prisma.tasteProfile.findUnique({ where: { userId } }),
    prisma.watchlistItem.findMany({
      where: { userId, watchedAt: { not: null } },
      orderBy: { watchedAt: 'desc' },
      take: 12,
      select: { id: true, tmdbId: true, mediaType: true, title: true, posterPath: true, watchedAt: true },
    }),
    prisma.userAchievement.findMany({ where: { userId }, select: { badge: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true, referralCode: true } }),
  ])

  const referralCount = await prisma.user.count({ where: { referredById: userId } })

  const topGenres = (tasteProfile?.genreIds ?? [])
    .slice(0, 5)
    .map((id) => GENRE_NAMES[id] ?? `Жанр ${id}`)

  const unlockedBadgeIds = userAchievements.map((a) => a.badge as BadgeId)
  const xp = userXpData?.xp ?? 0
  const level = userXpData?.level ?? 1
  const referralCode = userXpData?.referralCode ?? ''
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'https://kinopolka.vercel.app'
  const xpForCurrent = getXpForCurrentLevel(level)
  const xpForNext = getXpForNextLevel(level)
  const xpProgress = xpForNext > xpForCurrent
    ? Math.round(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100)
    : 100

  const user = session.user

  return (
    <div className="pb-12">
      {/* User header */}
      <div className="mb-10 flex items-center gap-5">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? 'Аватар'}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <User className="size-7 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
              {user.name ?? 'Пользователь'}
            </h1>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
              Ур. {level}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {xp} / {xpForNext} XP
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-border py-4">
        <Link
          href="/watchlist"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bookmark className="size-4 text-primary" />
          <span>
            <strong className="font-bold text-foreground">{watchlistCount}</strong>
            &nbsp;в вотчлисте
          </span>
        </Link>

        <span className="h-4 w-px bg-border" aria-hidden />

        <Link
          href="/watchlist?tab=watched"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Eye className="size-4 text-emerald-500" />
          <span>
            <strong className="font-bold text-foreground">{watchedCount}</strong>
            &nbsp;просмотрено
          </span>
        </Link>

        <span className="h-4 w-px bg-border" aria-hidden />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="size-4 text-gold" />
          <span>
            <strong className="font-bold text-foreground">{ratingsCount}</strong>
            &nbsp;оценено
          </span>
        </div>

        <span className="h-4 w-px bg-border" aria-hidden />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Film className="size-4 text-muted-foreground" />
          <span>
            <strong className="font-bold text-foreground">{tasteProfile?.genreIds.length ?? 0}</strong>
            &nbsp;жанров в профиле
          </span>
        </div>
      </div>

      {/* Taste genres */}
      {topGenres.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Ваш вкус
          </h2>
          <div className="flex flex-wrap gap-2">
            {topGenres.map((name) => (
              <span
                key={name}
                className="rounded-md border border-border bg-muted px-3 py-1 text-sm font-medium"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <AchievementsSection unlockedIds={unlockedBadgeIds} totalXp={xp} level={level} />

      {/* Recently watched */}
      {watchedItems.length > 0 && (
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Недавно просмотрено</h2>
            <Link
              href="/watchlist?tab=watched"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Все&nbsp;→
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
            {watchedItems.slice(0, 12).map((item) => {
              const href = `/${item.mediaType}/${item.tmdbId}`
              const posterUrl = item.posterPath ? getPosterUrl(item.posterPath, 'w185') : null
              return (
                <Link key={item.id} href={href} className="group">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-1">
                        <span className="text-center text-[10px] text-muted-foreground">{item.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  {item.watchedAt && (
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {formatDate(item.watchedAt)}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mb-10 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/watchlist"
          className="rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
        >
          Мой вотчлист
        </Link>
        <Link
          href="/collections"
          className="rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
        >
          Коллекции
        </Link>
        <Link
          href="/onboarding"
          className="rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
        >
          Обновить вкусы
        </Link>
      </div>

      {referralCode && (
        <ReferralSection
          referralCode={referralCode}
          referralCount={referralCount}
          baseUrl={baseUrl}
        />
      )}

      <AiRecommender />
    </div>
  )
}
