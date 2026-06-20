import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ArrowLeft, Plus, Globe, Lock } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getPosterUrl } from '@/lib/tmdb-image'
import { CreateCollectionForm } from '@/components/collections/create-collection-form'

export const metadata: Metadata = {
  title: 'Мои коллекции — Кинополка',
}

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    include: { items: { orderBy: { addedAt: 'desc' }, take: 4 } },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="pb-12">
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Профиль
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Мои коллекции</h1>
      </div>

      <CreateCollectionForm />

      {collections.length === 0 ? (
        <div className="mt-8 py-12 text-center text-muted-foreground">
          <Plus className="mx-auto mb-3 size-8 opacity-30" />
          <p>Нет коллекций</p>
          <p className="mt-1 text-sm">Создайте первую коллекцию выше</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {collections.map((col) => {
            const previews = col.items.slice(0, 4)
            return (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                    {col.title}
                  </h2>
                  {col.isPublic
                    ? <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                    : <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                  }
                </div>
                {col.description && (
                  <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{col.description}</p>
                )}
                {previews.length > 0 ? (
                  <div className="flex gap-1.5">
                    {previews.map((item) => {
                      const posterUrl = item.posterPath ? getPosterUrl(item.posterPath, 'w185') : null
                      return (
                        <div key={item.id} className="relative aspect-[2/3] w-12 overflow-hidden rounded-md bg-muted">
                          {posterUrl && (
                            <Image src={posterUrl} alt={item.title} fill sizes="48px" className="object-cover" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Пустая коллекция</p>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {col.items.length} фильмов
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
