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
        <h1 className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Мой вотчлист
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {items.length === 0
            ? 'Пока ничего не сохранено'
            : pluralize(items.length, 'фильм', 'фильма', 'фильмов')}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Bookmark className="size-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Пока пусто</p>
            <p className="mt-1 text-sm text-muted-foreground" style={{ maxWidth: '28ch' }}>
              Добавляй фильмы и сериалы, чтобы не потерять
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Найти что посмотреть
          </Link>
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
              <Link
                key={item.id}
                href={href}
                className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-muted"
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
                {/* Gradient + info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-[13px] font-semibold leading-tight text-white line-clamp-2">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/50 capitalize">
                    {item.mediaType === 'tv' ? 'Сериал' : 'Фильм'}
                  </p>
                </div>
                {/* Hover ring */}
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/0 transition-all duration-300 group-hover:ring-white/12 pointer-events-none" />
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
