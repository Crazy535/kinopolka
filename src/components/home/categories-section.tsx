import { getTrendingTVShows, discoverMovies } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

interface CategoryRowProps {
  title: string
  items: (TMDBMovie | TMDBTVShow)[]
}

function CategoryRow({ title, items }: CategoryRowProps) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold tracking-tight">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <div key={item.id} className="w-36 shrink-0 sm:w-40">
            <MovieCard movie={item} providers={null} priority={i === 0} />
          </div>
        ))}
      </div>
    </section>
  )
}

export async function CategoriesSection() {
  const [tvTrending, comedies, scifi, thrillers] = await Promise.all([
    getTrendingTVShows('week'),
    discoverMovies({ sort_by: 'popularity.desc', with_genres: '35', 'vote_count.gte': 100 }),
    discoverMovies({ sort_by: 'popularity.desc', with_genres: '878', 'vote_count.gte': 100 }),
    discoverMovies({ sort_by: 'popularity.desc', with_genres: '53,27', 'vote_count.gte': 80 }),
  ])

  const sections: { title: string; items: (TMDBMovie | TMDBTVShow)[] }[] = [
    { title: 'Трендовые сериалы', items: tvTrending.results.slice(0, 10) },
    { title: 'Комедии', items: comedies.results.slice(0, 10) },
    { title: 'Фантастика', items: scifi.results.slice(0, 10) },
    { title: 'Триллеры и ужасы', items: thrillers.results.slice(0, 10) },
  ]

  return (
    <div className="space-y-10">
      {sections.map(({ title, items }) => (
        <CategoryRow key={title} title={title} items={items} />
      ))}
    </div>
  )
}
