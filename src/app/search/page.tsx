import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { searchMulti, discoverMovies, discoverTVShows } from '@/lib/tmdb'
import { calcMatchScore } from '@/lib/match-score'
import { MovieCard } from '@/components/movie-card'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { SearchFilters } from '@/components/search/search-filters'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    q?: string
    type?: string
    genre?: string
    year?: string
    page?: string
  }>
}

type AnyItem = (TMDBMovie | TMDBTVShow) & { media_type?: string }

interface SearchResultsData {
  items: AnyItem[]
  totalPages: number
  currentPage: number
}

async function fetchResults(
  query: string,
  type: string,
  genre: string,
  year: string,
  page: number
): Promise<SearchResultsData> {
  if (query.length >= 2) {
    const data = await searchMulti(query, page)
    const filterType = type === 'movie' ? 'movie' : type === 'tv' ? 'tv' : null

    const items = (data.results as Array<AnyItem & { media_type: string }>)
      .filter((r) => {
        if (!r.poster_path) return false
        if (filterType) return r.media_type === filterType
        return r.media_type === 'movie' || r.media_type === 'tv'
      })

    return {
      items,
      totalPages: Math.min(data.total_pages, 20),
      currentPage: page,
    }
  }

  if (genre || year) {
    if (type === 'tv') {
      const data = await discoverTVShows({
        page,
        sort_by: 'popularity.desc',
        with_genres: genre || undefined,
        ...(year ? { 'first_air_date.gte': `${year}-01-01`, 'first_air_date.lte': `${year}-12-31` } : {}),
        'vote_count.gte': 50,
      })
      return {
        items: data.results.filter((r) => r.poster_path).map((r) => ({ ...r, media_type: 'tv' as const })),
        totalPages: Math.min(data.total_pages, 20),
        currentPage: page,
      }
    } else {
      const data = await discoverMovies({
        page,
        sort_by: 'popularity.desc',
        with_genres: genre || undefined,
        ...(year ? { 'primary_release_date.gte': `${year}-01-01`, 'primary_release_date.lte': `${year}-12-31` } : {}),
        'vote_count.gte': 100,
      })
      return {
        items: data.results.filter((r) => r.poster_path).map((r) => ({ ...r, media_type: 'movie' as const })),
        totalPages: Math.min(data.total_pages, 20),
        currentPage: page,
      }
    }
  }

  return { items: [], totalPages: 1, currentPage: page }
}

function buildPageUrl(
  base: URLSearchParams,
  targetPage: number
): string {
  const p = new URLSearchParams(base.toString())
  if (targetPage === 1) {
    p.delete('page')
  } else {
    p.set('page', String(targetPage))
  }
  const qs = p.toString()
  return `/search${qs ? `?${qs}` : ''}`
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number
  totalPages: number
  searchParams: URLSearchParams
}) {
  if (totalPages <= 1) return null

  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      {hasPrev ? (
        <Link
          href={buildPageUrl(searchParams, currentPage - 1)}
          className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Назад
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm opacity-30">
          <ChevronLeft className="size-4" />
          Назад
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={buildPageUrl(searchParams, currentPage + 1)}
          className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          Вперёд
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm opacity-30">
          Вперёд
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  )
}

async function SearchResults({
  query,
  type,
  genre,
  year,
  page,
  rawParams,
  userGenreIds,
}: {
  query: string
  type: string
  genre: string
  year: string
  page: number
  rawParams: URLSearchParams
  userGenreIds: number[]
}) {
  const { items, totalPages, currentPage } = await fetchResults(query, type, genre, year, page)

  if (items.length === 0) {
    const hasFilters = query || genre || year || type
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">
          {hasFilters ? 'Ничего не найдено. Попробуй изменить фильтры.' : 'Введите запрос или выберите фильтры'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => {
          const matchScore = userGenreIds.length > 0
            ? (calcMatchScore(item.genre_ids, userGenreIds) ?? undefined)
            : undefined
          return (
            <MovieCard
              key={`${(item as AnyItem & { media_type?: string }).media_type ?? 'movie'}-${item.id}`}
              movie={item as TMDBMovie | TMDBTVShow}
              providers={null}
              matchScore={matchScore}
            />
          )
        })}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} searchParams={rawParams} />
    </>
  )
}

export default async function SearchPage({ searchParams }: Props) {
  const [sp, session] = await Promise.all([searchParams, auth()])
  const query = sp.q?.trim() ?? ''
  const type = sp.type ?? ''
  const genre = sp.genre ?? ''
  const year = sp.year ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))

  let userGenreIds: number[] = []
  if (session?.user?.id) {
    const profile = await prisma.tasteProfile.findUnique({
      where: { userId: session.user.id },
      select: { genreIds: true },
    })
    userGenreIds = profile?.genreIds ?? []
  }

  const rawParams = new URLSearchParams()
  if (query) rawParams.set('q', query)
  if (type) rawParams.set('type', type)
  if (genre) rawParams.set('genre', genre)
  if (year) rawParams.set('year', year)
  if (page > 1) rawParams.set('page', String(page))

  const hasContent = query.length >= 2 || genre || year

  return (
    <div className="pb-12">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="size-4" />
          <span className="text-sm">Поиск</span>
        </div>
        {query ? (
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            «{query}»
          </h1>
        ) : (
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-muted-foreground sm:text-3xl">
            Поиск фильмов и сериалов
          </h1>
        )}
      </div>

      <Suspense fallback={null}>
        <SearchFilters />
      </Suspense>

      {hasContent ? (
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <SearchResults
            query={query}
            type={type}
            genre={genre}
            year={year}
            page={page}
            rawParams={rawParams}
            userGenreIds={userGenreIds}
          />
        </Suspense>
      ) : (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Введите запрос или выберите фильтры выше</p>
        </div>
      )}
    </div>
  )
}
