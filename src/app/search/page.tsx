import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { searchMovies, searchTV, discoverMovies, discoverTVShows, hasNonLatinCyrillic } from '@/lib/tmdb'
import { calcMatchScore } from '@/lib/match-score'
import { MovieCard } from '@/components/movie-card'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { SearchFilters } from '@/components/search/search-filters'
import { AiRecommender } from '@/components/ai-recommender'
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

type AnyItem = (TMDBMovie | TMDBTVShow) & { media_type: 'movie' | 'tv' }

interface SearchResultsData {
  movieItems: AnyItem[]
  tvItems: AnyItem[]
  movieTotalPages: number
  tvTotalPages: number
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
    const filterType = type === 'movie' ? 'movie' : type === 'tv' ? 'tv' : null
    const wantMovies = filterType === null || filterType === 'movie'
    const wantTV = filterType === null || filterType === 'tv'

    const [moviesRu, moviesEn, tvRu, tvEn] = await Promise.all([
      wantMovies ? searchMovies(query, page, 'ru-RU') : null,
      wantMovies ? searchMovies(query, page, 'en-US') : null,
      wantTV ? searchTV(query, page, 'ru-RU') : null,
      wantTV ? searchTV(query, page, 'en-US') : null,
    ])

    const enMovieMap = new Map<number, string>()
    if (moviesEn) for (const m of moviesEn.results) enMovieMap.set(m.id, m.title)

    const enTVMap = new Map<number, string>()
    if (tvEn) for (const s of tvEn.results) enTVMap.set(s.id, s.name)

    const movieItems: AnyItem[] = (moviesRu?.results ?? []).map((m) => ({
      ...m,
      title: hasNonLatinCyrillic(m.title) ? (enMovieMap.get(m.id) ?? m.title) : m.title,
      media_type: 'movie' as const,
    }))

    // Supplement with en-US items when ru-RU returns sparse results
    if (movieItems.length < 3 && moviesEn) {
      const ruIds = new Set(movieItems.map((m) => m.id))
      for (const m of moviesEn.results) {
        if (!ruIds.has(m.id)) {
          movieItems.push({ ...m, media_type: 'movie' as const })
          ruIds.add(m.id)
        }
        if (movieItems.length >= 10) break
      }
    }

    const tvItems: AnyItem[] = (tvRu?.results ?? []).map((s) => ({
      ...s,
      name: hasNonLatinCyrillic(s.name) ? (enTVMap.get(s.id) ?? s.name) : s.name,
      media_type: 'tv' as const,
    }))

    // Supplement with en-US items when ru-RU returns sparse results
    if (tvItems.length < 3 && tvEn) {
      const ruIds = new Set(tvItems.map((s) => s.id))
      for (const s of tvEn.results) {
        if (!ruIds.has(s.id)) {
          tvItems.push({ ...s, media_type: 'tv' as const })
          ruIds.add(s.id)
        }
        if (tvItems.length >= 10) break
      }
    }

    return {
      movieItems,
      tvItems,
      movieTotalPages: Math.min(moviesRu?.total_pages ?? 1, 20),
      tvTotalPages: Math.min(tvRu?.total_pages ?? 1, 20),
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
        movieItems: [],
        tvItems: data.results.map((r) => ({ ...r, media_type: 'tv' as const })),
        movieTotalPages: 1,
        tvTotalPages: Math.min(data.total_pages, 20),
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
        movieItems: data.results.map((r) => ({ ...r, media_type: 'movie' as const })),
        tvItems: [],
        movieTotalPages: Math.min(data.total_pages, 20),
        tvTotalPages: 1,
        currentPage: page,
      }
    }
  }

  return { movieItems: [], tvItems: [], movieTotalPages: 1, tvTotalPages: 1, currentPage: page }
}

function buildPageUrl(base: URLSearchParams, targetPage: number): string {
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
  const { movieItems, tvItems, movieTotalPages, tvTotalPages, currentPage } =
    await fetchResults(query, type, genre, year, page)

  const filterType = type === 'movie' ? 'movie' : type === 'tv' ? 'tv' : null
  const isDiscover = query.length < 2 && (!!genre || !!year)

  const isEmpty = movieItems.length === 0 && tvItems.length === 0

  if (isEmpty) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">
          {query || genre || year
            ? 'Ничего не найдено. Попробуй изменить фильтры.'
            : 'Введите запрос или выберите фильтры'}
        </p>
      </div>
    )
  }

  function renderCard(item: AnyItem, i: number) {
    const matchScore =
      userGenreIds.length > 0
        ? (calcMatchScore(item.genre_ids, userGenreIds) ?? undefined)
        : undefined
    return (
      <MovieCard
        key={`${item.media_type}-${item.id}`}
        movie={item as TMDBMovie | TMDBTVShow}
        providers={null}
        priority={i === 0}
        matchScore={matchScore}
      />
    )
  }

  // Combined mode: separate sections for movies and TV, sorted by TMDB relevance
  if (filterType === null && !isDiscover) {
    const qParam = query ? `q=${encodeURIComponent(query)}` : ''
    const genreParam = genre ? `&genre=${genre}` : ''
    const yearParam = year ? `&year=${year}` : ''
    const baseParams = [qParam, genreParam.replace(/^&/, ''), yearParam.replace(/^&/, '')]
      .filter(Boolean)
      .join('&')
    const movieFilterUrl = `/search?${baseParams}&type=movie`
    const tvFilterUrl = `/search?${baseParams}&type=tv`

    return (
      <div className="space-y-10">
        {movieItems.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                Фильмы
                <span className="ml-1.5 tabular-nums">
                  ({movieItems.length}{movieTotalPages > 1 ? '+' : ''})
                </span>
              </h2>
              {movieTotalPages > 1 && (
                <Link
                  href={movieFilterUrl}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Все фильмы →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {movieItems.slice(0, 10).map((item, i) => renderCard(item, i))}
            </div>
          </section>
        )}
        {tvItems.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                Сериалы
                <span className="ml-1.5 tabular-nums">
                  ({tvItems.length}{tvTotalPages > 1 ? '+' : ''})
                </span>
              </h2>
              {tvTotalPages > 1 && (
                <Link
                  href={tvFilterUrl}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Все сериалы →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {tvItems.slice(0, 10).map((item, i) => renderCard(item, i))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // Single type or discover mode: paginated grid
  const items =
    filterType === 'tv' || (isDiscover && type === 'tv') ? tvItems : movieItems
  const totalPages =
    filterType === 'tv' || (isDiscover && type === 'tv') ? tvTotalPages : movieTotalPages

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item, i) => renderCard(item, i))}
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
        <div className="mt-4">
          <AiRecommender />
        </div>
      )}
    </div>
  )
}
