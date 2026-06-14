import { getTopRatedMovies, getPopularMovies, getPopularTVShows } from '@/lib/tmdb'
import { CategoryCarousel } from './category-carousel'

export async function CategoriesSection({ userGenreIds }: { userGenreIds?: number[] }) {
  const [topRated, popularMovies, popularSeries] = await Promise.all([
    getTopRatedMovies(),
    getPopularMovies(),
    getPopularTVShows(),
  ])

  const sections = [
    {
      title: 'Топ-рейтинг',
      items: topRated.results.slice(0, 20),
      browseHref: '/browse/top-rated',
    },
    {
      title: 'Популярные зарубежные фильмы',
      items: popularMovies.results.slice(0, 20),
      browseHref: '/browse/popular-movies',
    },
    {
      title: 'Популярные зарубежные сериалы',
      items: popularSeries.results.slice(0, 20),
      browseHref: '/browse/popular-series',
    },
  ]

  return (
    <div className="space-y-10">
      {sections.map(({ title, items, browseHref }) => (
        <CategoryCarousel
          key={title}
          title={title}
          items={items}
          browseHref={browseHref}
          userGenreIds={userGenreIds}
        />
      ))}
    </div>
  )
}
