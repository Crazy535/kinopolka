import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { User, ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { MOVIE_GENRES } from '@/lib/tmdb-genres'
import { BADGES, getXpForCurrentLevel, getXpForNextLevel, type BadgeId } from '@/lib/achievements'
import { PublicProfileCard } from '@/components/profile/public-profile-card'

export const revalidate = 60

const BASE_URL = 'https://kinopolka.vercel.app'

interface Props {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      image: true,
      level: true,
      tasteProfile: { select: { genreIds: true } },
    },
  })

  if (!user) return { title: 'Профиль не найден' }

  const name = user.name ?? 'Пользователь'
  const topGenres = (user.tasteProfile?.genreIds ?? [])
    .slice(0, 3)
    .map((id) => MOVIE_GENRES[id])
    .filter(Boolean)

  const description = topGenres.length > 0
    ? `Уровень ${user.level} · Любит: ${topGenres.join(', ')}`
    : `Кинофил уровня ${user.level} на Кинополке`

  return {
    title: `${name} — профиль на Кинополке`,
    description,
    openGraph: {
      title: `${name} на Кинополке`,
      description,
      url: `${BASE_URL}/profile/${userId}`,
      images: user.image ? [{ url: user.image, width: 400, height: 400 }] : [],
    },
    twitter: {
      card: 'summary',
      title: `${name} на Кинополке`,
      description,
      images: user.image ? [user.image] : [],
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      xp: true,
      level: true,
      tasteProfile: { select: { genreIds: true } },
      achievements: { select: { badge: true } },
      collections: {
        where: { isPublic: true },
        select: {
          id: true,
          title: true,
          description: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      },
    },
  })

  if (!user) notFound()

  const genreIds = user.tasteProfile?.genreIds ?? []
  const topGenres = genreIds.slice(0, 5).map((id) => MOVIE_GENRES[id]).filter(Boolean)

  const badgeIds = user.achievements.map((a) => a.badge as BadgeId)
  const unlockedSet = new Set(badgeIds)
  const unlockedBadges = BADGES.filter((b) => unlockedSet.has(b.id))

  const xp = user.xp ?? 0
  const level = user.level ?? 1
  const xpForCurrent = getXpForCurrentLevel(level)
  const xpForNext = getXpForNextLevel(level)
  const xpProgress = xpForNext > xpForCurrent
    ? Math.round(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100)
    : 100

  return (
    <div className="pb-12">
      <Link
        href="/"
        className="mb-8 flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        На главную
      </Link>

      {/* Summary card (OG preview style) */}
      <PublicProfileCard
        name={user.name}
        image={user.image}
        level={level}
        xp={xp}
        genreIds={genreIds}
        badgeIds={badgeIds}
      />

      {/* XP bar */}
      <div className="mb-10 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {xp} / {xpForNext} XP
        </span>
      </div>

      {/* Taste genres */}
      {topGenres.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Вкус
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

      {/* Unlocked achievements */}
      {unlockedBadges.length > 0 && (
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Достижения</h2>
            <span className="text-sm text-muted-foreground">
              {unlockedBadges.length} / {BADGES.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                title={badge.description}
                className="flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-center"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary text-base font-bold">
                  ★
                </div>
                <p className="text-[12px] font-semibold leading-tight">{badge.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public collections */}
      {user.collections.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-bold tracking-tight">Коллекции</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {user.collections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted"
              >
                <p className="font-semibold transition-colors group-hover:text-primary">
                  {col.title}
                </p>
                {col.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {col.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {col._count.items} фильмов
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA for non-users */}
      <div className="rounded-xl border border-border bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Хочешь отслеживать фильмы и делиться своим вкусом?
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Открыть Кинополку
        </Link>
      </div>
    </div>
  )
}
