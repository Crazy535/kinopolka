import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { MovieCard } from '@/components/movie-card'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

export const revalidate = 86400

interface SharedPageProps {
  params: Promise<{ id: string }>
}

interface SharedMovie {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  vote_average: number
  vote_count: number
  release_date?: string
  first_air_date?: string
  genre_ids?: number[]
  overview?: string
}

function toMovieLike(m: SharedMovie, mediaType: string): TMDBMovie | TMDBTVShow {
  if (mediaType === 'tv') {
    return {
      id: m.id,
      name: m.name ?? m.title ?? '',
      original_name: m.name ?? m.title ?? '',
      overview: m.overview ?? '',
      poster_path: m.poster_path,
      backdrop_path: null,
      first_air_date: m.first_air_date ?? '',
      vote_average: m.vote_average,
      vote_count: m.vote_count ?? 0,
      popularity: 0,
      genre_ids: m.genre_ids ?? [],
      original_language: 'ru',
      origin_country: [],
    } satisfies TMDBTVShow
  }
  return {
    id: m.id,
    title: m.title ?? m.name ?? '',
    original_title: m.title ?? m.name ?? '',
    overview: m.overview ?? '',
    poster_path: m.poster_path,
    backdrop_path: null,
    release_date: m.release_date ?? '',
    vote_average: m.vote_average,
    vote_count: m.vote_count ?? 0,
    popularity: 0,
    genre_ids: m.genre_ids ?? [],
    original_language: 'ru',
    adult: false,
    video: false,
  } satisfies TMDBMovie
}

export default async function SharedPage({ params }: SharedPageProps) {
  const { id } = await params

  let shared
  try {
    shared = await prisma.sharedResult.findUnique({ where: { id } })
  } catch {
    notFound()
  }

  if (!shared) notFound()

  const params_data = shared.params as { movies?: SharedMovie[] }
  const movies = params_data.movies ?? []

  const count = movies.length
  const label =
    count === 1 ? '1 вариант' : count < 5 ? `${count} варианта` : `${count} вариантов`

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
          Кинополка подобрала
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {label} за&nbsp;30&nbsp;сек
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Поделились подборкой фильмов специально для тебя
        </p>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4">
          {movies.map((m, i) => (
            <MovieCard
              key={m.id}
              movie={toMovieLike(m, shared!.mediaType)}
              providers={null}
              priority={i === 0}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">Подборка не найдена.</p>
      )}

      <div className="mt-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          Хочешь свою подборку?
        </p>
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Найди своё за 30 сек&nbsp;→
        </Link>
      </div>
    </div>
  )
}
