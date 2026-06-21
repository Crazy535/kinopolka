import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { MOVIE_GENRES } from '@/lib/tmdb-genres'
import { BADGES, getXpForCurrentLevel, getXpForNextLevel, type BadgeId } from '@/lib/achievements'
import { PublicProfileCard } from '@/components/profile/public-profile-card'
import { AchievementsSection } from '@/components/profile/achievements-section'

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
        className="mb-8 inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.98]"
      >
        <ArrowLeft className="size-4" />
        На главную
      </Link>

      <PublicProfileCard
        name={user.name}
        image={user.image}
        level={level}
        xp={xp}
        xpProgress={xpProgress}
        xpNext={xpForNext}
        topGenres={topGenres}
        badgeCount={badgeIds.length}
        totalBadges={BADGES.length}
      />

      {badgeIds.length > 0 && (
        <AchievementsSection unlockedIds={badgeIds} totalXp={xp} level={level} />
      )}

      {user.collections.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-bold tracking-tight">Коллекции</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {user.collections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/50 p-5 transition-colors duration-200 hover:border-primary/30 hover:bg-card"
              >
                <p className="font-semibold transition-colors duration-200 group-hover:text-primary">
                  {col.title}
                </p>
                {col.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {col.description}
                  </p>
                )}
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  {col._count.items} {col._count.items === 1 ? 'фильм' : 'фильмов'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-muted/50 to-muted/10 p-8 text-center">
        <div
          className="pointer-events-none absolute -bottom-8 left-1/2 size-48 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <p className="relative text-sm text-muted-foreground">
          Хочешь отслеживать фильмы и делиться своим вкусом?
        </p>
        <Link
          href="/"
          className="relative mt-4 inline-flex items-center rounded-xl bg-primary px-7 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          Открыть Кинополку
        </Link>
      </div>
    </div>
  )
}
