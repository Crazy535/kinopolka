import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getPosterUrl } from '@/lib/tmdb-image'
import { WatchCheckButton } from '@/components/watchlist/watch-check-button'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function WatchlistPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const { tab } = await searchParams
  const showWatched = tab === 'watched'

  const [toWatchCount, watchedCount, items] = await Promise.all([
    prisma.watchlistItem.count({ where: { userId: session.user.id, watchedAt: null } }),
    prisma.watchlistItem.count({ where: { userId: session.user.id, watchedAt: { not: null } } }),
    prisma.watchlistItem.findMany({
      where: {
        userId: session.user.id,
        watchedAt: showWatched ? { not: null } : null,
      },
      orderBy: showWatched ? { watchedAt: 'desc' } : { addedAt: 'desc' },
    }),
  ])

  const tabs = [
    { key: 'to-watch', label: 'Смотреть', count: toWatchCount, href: '/watchlist' },
    { key: 'watched', label: 'Просмотрено', count: watchedCount, href: '/watchlist?tab=watched' },
  ]
  const activeTab = showWatched ? 'watched' : 'to-watch'

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Мой вотчлист
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                activeTab === t.key
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {t.count}
              </span>
            )}
            {activeTab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-primary" />
            )}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Bookmark className="size-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">
              {showWatched ? 'Ещё ничего не просмотрено' : 'Пока ничего не сохранено'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground" style={{ maxWidth: '28ch' }}>
              {showWatched
                ? 'Отмечай фильмы галочкой когда посмотришь'
                : 'Добавляй фильмы и сериалы, чтобы не потерять'}
            </p>
          </div>
          {!showWatched && (
            <Link
              href="/"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Найти что посмотреть
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => {
            const href = item.mediaType === 'movie'
              ? `/movie/${item.tmdbId}`
              : `/tv/${item.tmdbId}`
            const posterUrl = item.posterPath
              ? getPosterUrl(item.posterPath, 'w342')
              : null

            return (
              <div key={item.id} className="relative">
                <Link
                  href={href}
                  className="group relative block aspect-[2/3] overflow-hidden rounded-lg bg-muted"
                >
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted text-xs text-muted-foreground">
                      Нет постера
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[13px] font-semibold leading-tight text-white line-clamp-2">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/50 capitalize">
                      {item.mediaType === 'tv' ? 'Сериал' : 'Фильм'}
                      {showWatched && item.watchedAt && (
                        <> &bull; {formatDate(item.watchedAt)}</>
                      )}
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/0 transition-all duration-300 group-hover:ring-white/12 pointer-events-none" />
                </Link>
                <WatchCheckButton id={item.id} watchedAt={item.watchedAt} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date)
}
