import {
  getTrendingTVShows,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
} from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import { calcMatchScore } from '@/lib/match-score'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

interface CategoryRowProps {
  title: string
  items: (TMDBMovie | TMDBTVShow)[]
  userGenreIds?: number[]
}

function CategoryRow({ title, items, userGenreIds }: CategoryRowProps) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold tracking-tight">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => {
          const matchScore = userGenreIds
            ? (calcMatchScore(item.genre_ids, userGenreIds) ?? undefined)
            : undefined
          return (
            <div key={item.id} className="w-36 shrink-0 sm:w-40">
              <MovieCard movie={item} providers={null} priority={i === 0} matchScore={matchScore} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export async function CategoriesSection({ userGenreIds }: { userGenreIds?: number[] }) {
  const [tvTrending, topRated, nowPlaying, upcoming] = await Promise.all([
    getTrendingTVShows('week'),
    getTopRatedMovies(),
    getNowPlayingMovies(),
    getUpcomingMovies(),
  ])

  const sections: { title: string; items: (TMDBMovie | TMDBTVShow)[] }[] = [
    { title: 'Трендовые сериалы', items: tvTrending.results.slice(0, 10) },
    { title: 'Топ-рейтинг', items: topRated.results.slice(0, 10) },
    { title: 'Сейчас в кино', items: nowPlaying.results.slice(0, 10) },
    { title: 'Скоро в кино', items: upcoming.results.slice(0, 10) },
  ]

  return (
    <div className="space-y-10">
      {sections.map(({ title, items }) => (
        <CategoryRow key={title} title={title} items={items} userGenreIds={userGenreIds} />
      ))}
    </div>
  )
}
