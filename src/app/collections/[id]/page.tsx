import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Globe, Lock } from 'lucide-react'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { getPosterUrl } from '@/lib/tmdb-image'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection || !collection.isPublic) return {}
  return {
    title: `${collection.title} — Кинополка`,
    description: collection.description ?? `Коллекция фильмов на Кинополке`,
  }
}

export default async function CollectionPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      items: { orderBy: { addedAt: 'desc' } },
      user: { select: { name: true } },
    },
  })

  if (!collection) notFound()
  if (!collection.isPublic && collection.userId !== session?.user?.id) notFound()

  const isOwner = session?.user?.id === collection.userId

  return (
    <div className="pb-12">
      <Link
        href={isOwner ? '/collections' : '/'}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {isOwner ? 'Мои коллекции' : 'На главную'}
      </Link>

      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {collection.title}
          </h1>
          {collection.isPublic
            ? <Globe className="size-4 text-muted-foreground" aria-label="Публичная" />
            : <Lock className="size-4 text-muted-foreground" aria-label="Приватная" />
          }
        </div>
        {collection.description && (
          <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {collection.user.name ?? 'Пользователь'} · {collection.items.length} фильмов
        </p>
      </div>

      {collection.items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>Коллекция пока пустая</p>
          {isOwner && (
            <p className="mt-1 text-sm">Добавляйте фильмы со страниц фильмов</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {collection.items.map((item) => {
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
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <span className="text-center text-[11px] text-muted-foreground">{item.title}</span>
                    </div>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{item.title}</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
