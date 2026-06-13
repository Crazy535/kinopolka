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
      <div className="mb-8 flex items-center gap-5">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? 'Аватар'}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <User className="size-8 text-muted-foreground" />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{user.name ?? 'Пользователь'}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Bookmark className="size-5 text-primary" />}
          label="В вотчлисте"
          value={watchlistCount}
          href="/watchlist"
        />
        <StatCard
          icon={<Star className="size-5 text-yellow-400" />}
          label="Оценено"
          value={ratingsCount}
        />
        <StatCard
          icon={<Film className="size-5 text-muted-foreground" />}
          label="Жанров в профиле"
          value={tasteProfile?.genreIds.length ?? 0}
        />
      </div>

      {/* Taste */}
      {topGenres.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-base font-semibold">Ваш вкус</h2>
          <div className="flex flex-wrap gap-2">
            {topGenres.map((name) => (
              <span
                key={name}
                className="rounded-full border border-border bg-muted px-3 py-1 text-sm"
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
          className="rounded-xl border border-border px-5 py-2.5 text-center text-sm font-medium hover:bg-muted transition-colors"
        >
          Мой вотчлист
        </Link>
        <Link
          href="/onboarding"
          className="rounded-xl border border-border px-5 py-2.5 text-center text-sm font-medium hover:bg-muted transition-colors"
        >
          Обновить вкусы
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: number
  href?: string
}) {
  const content = (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}
