import { Suspense } from 'react'
import { Search } from 'lucide-react'
import { searchMulti } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'
import type { TMDBSearchMultiItem } from '@/types/tmdb'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ q?: string }>
}

function toCardItem(item: TMDBSearchMultiItem): TMDBMovie | TMDBTVShow {
  return item as unknown as TMDBMovie | TMDBTVShow
}

function ResultsGrid({ items }: { items: TMDBSearchMultiItem[] }) {
  const filtered = items.filter(
    (r) => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path
  )

  if (filtered.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Ничего не найдено</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {filtered.map((item) => (
        <MovieCard
          key={`${item.media_type}-${item.id}`}
          movie={toCardItem(item)}
          providers={null}
        />
      ))}
    </div>
  )
}

async function SearchResults({ query }: { query: string }) {
  const data = await searchMulti(query)
  return <ResultsGrid items={data.results} />
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  return (
    <div className="pb-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="size-4" />
          <span className="text-sm">Поиск</span>
        </div>
        {query ? (
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            «{query}»
          </h1>
        ) : (
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-muted-foreground">
            Введите запрос в строке поиска
          </h1>
        )}
      </div>

      {query.length >= 2 ? (
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <SearchResults query={query} />
        </Suspense>
      ) : query.length > 0 ? (
        <p className="text-sm text-muted-foreground">Введите минимум 2 символа</p>
      ) : null}
    </div>
  )
}
