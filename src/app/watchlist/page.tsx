import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getPosterUrl } from '@/lib/tmdb-image'

export const dynamic = 'force-dynamic'

export default async function WatchlistPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: 'desc' },
  })

  return (
    <div className="pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Мой вотчлист</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length === 0
            ? 'Пока ничего не сохранено'
            : `${items.length} ${pluralize(items.length, 'фильм', 'фильма', 'фильмов')}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Bookmark className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Добавляйте фильмы и сериалы, чтобы не потерять
          </p>
          <Link
            href="/"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Найти что посмотреть
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => {
            const href = item.mediaType === 'movie'
              ? `/movie/${item.tmdbId}`
              : `/tv/${item.tmdbId}`
            const posterUrl = item.posterPath
              ? getPosterUrl(item.posterPath, 'w342')
              : null

            return (
              <Link
                key={item.id}
                href={href}
                className="group flex flex-col rounded-lg overflow-hidden border border-border bg-card hover:bg-surface-hover transition-colors"
              >
                <div className="relative aspect-[2/3] w-full bg-muted">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                      Нет постера
                    </div>
                  )}
                </div>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium leading-tight line-clamp-2">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                    {item.mediaType === 'tv' ? 'Сериал' : 'Фильм'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`
  if (mod10 === 1) return `${n} ${one}`
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`
  return `${n} ${many}`
}
