import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getTopRatedMovies, getPopularMovies, getPopularTVShows } from '@/lib/tmdb'
import { calcMatchScore } from '@/lib/match-score'
import { MovieCard } from '@/components/movie-card'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

type Slug = 'top-rated' | 'popular-movies' | 'popular-series'

const CATEGORY_MAP: Record<Slug, {
  title: string
  fetcher: (page: number) => Promise<{ results: (TMDBMovie | TMDBTVShow)[]; total_pages: number }>
}> = {
  'top-rated': { title: 'Топ-рейтинг', fetcher: getTopRatedMovies },
  'popular-movies': { title: 'Популярные зарубежные фильмы', fetcher: getPopularMovies },
  'popular-series': { title: 'Популярные зарубежные сериалы', fetcher: getPopularTVShows },
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const category = CATEGORY_MAP[slug as Slug]
  if (!category) return {}
  return { title: `${category.title} — Кинополка` }
}

export default async function BrowsePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams

  const category = CATEGORY_MAP[slug as Slug]
  if (!category) notFound()

  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const session = await auth()
  let userGenreIds: number[] = []
  if (session?.user?.id) {
    const profile = await prisma.tasteProfile.findUnique({
      where: { userId: session.user.id },
      select: { genreIds: true },
    })
    userGenreIds = profile?.genreIds ?? []
  }

  const data = await category.fetcher(page)

  const totalPages = Math.min(data.total_pages, 20)
  const prevPage = page > 1 ? page - 1 : null
  const nextPage = page < totalPages ? page + 1 : null

  const buildHref = (p: number) => `/browse/${slug}?page=${p}`

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          aria-label="На главную"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
          {category.title}
        </h1>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {data.results.map((item, i) => {
          const matchScore = userGenreIds.length > 0
            ? (calcMatchScore(item.genre_ids, userGenreIds) ?? undefined)
            : undefined
          return (
            <MovieCard key={item.id} movie={item} providers={null} priority={i < 5} matchScore={matchScore} />
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          {prevPage ? (
            <Link
              href={buildHref(prevPage)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              aria-label="Предыдущая страница"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <div className="h-9 w-9" />
          )}

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = page <= 4
                ? i + 1
                : page >= totalPages - 3
                ? totalPages - 6 + i
                : page - 3 + i
              if (p < 1 || p > totalPages) return null
              return (
                <Link
                  key={p}
                  href={buildHref(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border/60 bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground'
                  }`}
                >
                  {p}
                </Link>
              )
            })}
          </div>

          {nextPage ? (
            <Link
              href={buildHref(nextPage)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              aria-label="Следующая страница"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="h-9 w-9" />
          )}
        </div>
      )}

      {/* Page counter */}
      {totalPages > 1 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Страница {page} из {totalPages}
        </p>
      )}
    </div>
  )
}
