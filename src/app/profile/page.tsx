import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { User, Bookmark, Star, Film } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

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

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const userId = session.user.id

  const [watchlistCount, ratingsCount, tasteProfile] = await Promise.all([
    prisma.watchlistItem.count({ where: { userId } }),
    prisma.rating.count({ where: { userId } }),
    prisma.tasteProfile.findUnique({ where: { userId } }),
  ])

  const topGenres = (tasteProfile?.genreIds ?? [])
    .slice(0, 5)
    .map((id) => GENRE_NAMES[id] ?? `Жанр ${id}`)

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

        <div>
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
            {user.name ?? 'Пользователь'}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Stats — inline horizontal, not hero-metric cards */}
      <div className="mb-8 flex flex-wrap items-center gap-6 border-y border-border py-4">
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

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/watchlist"
          className="rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
        >
          Мой вотчлист
        </Link>
        <Link
          href="/onboarding"
          className="rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
        >
          Обновить вкусы
        </Link>
      </div>
    </div>
  )
}
