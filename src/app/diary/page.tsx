import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getPosterUrl } from '@/lib/tmdb-image'
import { DiaryRemoveButton } from '@/components/diary/diary-remove-button'

export const dynamic = 'force-dynamic'

export default async function DiaryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const logs = await prisma.watchLog.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: 'desc' },
  })

  // Группируем по "YYYY-M" → human label
  const grouped = new Map<string, { label: string; entries: typeof logs }>()

  for (const log of logs) {
    const d = new Date(log.watchedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!grouped.has(key)) {
      const label = new Intl.DateTimeFormat('ru-RU', {
        month: 'long',
        year: 'numeric',
      }).format(d)
      grouped.set(key, { label: capitalize(label), entries: [] })
    }
    grouped.get(key)!.entries.push(log)
  }

  const totalCount = logs.length

  return (
    <div className="pb-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Дневник
          </h1>
          {totalCount > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount} {plural(totalCount, 'просмотр', 'просмотра', 'просмотров')} за всё время
            </p>
          )}
        </div>
      </div>

      {grouped.size === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="size-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Дневник пока пуст</p>
            <p className="mt-1 text-sm text-muted-foreground" style={{ maxWidth: '30ch' }}>
              Отмечай фильмы просмотренными в вотчлисте — они появятся здесь
            </p>
          </div>
          <Link
            href="/watchlist"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Перейти в вотчлист
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(grouped.entries()).map(([key, { label, entries }]) => (
            <section key={key}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-heading text-xl font-semibold capitalize">{label}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {entries.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {entries.map((log) => {
                  const href = log.mediaType === 'movie'
                    ? `/movie/${log.tmdbId}`
                    : `/tv/${log.tmdbId}`
                  const posterUrl = log.posterPath
                    ? getPosterUrl(log.posterPath, 'w185')
                    : null
                  const dayLabel = new Intl.DateTimeFormat('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  }).format(new Date(log.watchedAt))

                  return (
                    <div key={log.id} className="group relative">
                      <Link
                        href={href}
                        className="block aspect-[2/3] overflow-hidden rounded-lg bg-muted"
                        title={log.title}
                      >
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={log.title}
                            fill
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 15vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted p-2 text-center text-[11px] leading-tight text-muted-foreground">
                            {log.title}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-[10px] text-white/60">{dayLabel}</p>
                          {log.isRewatch && (
                            <span className="mt-0.5 inline-block rounded bg-primary/80 px-1 py-px text-[9px] font-semibold uppercase leading-none text-white">
                              Повтор
                            </span>
                          )}
                        </div>
                      </Link>
                      <DiaryRemoveButton logId={log.id} />
                      {log.note && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-tight text-muted-foreground">
                          {log.note}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}
