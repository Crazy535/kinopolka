import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { MovieCard } from '@/components/movie-card'
import { AiExplanation } from '@/components/ai-explanation'
import { calcMatchScore } from '@/lib/match-score'
import { MOVIE_GENRES, TV_GENRES } from '@/lib/tmdb-genres'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

export const dynamic = 'force-dynamic'

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

  const [session, shared] = await Promise.all([
    auth(),
    prisma.sharedResult.findUnique({ where: { id } }).catch(() => null),
  ])

  if (!shared) notFound()

  const userGenreIds: number[] = []
  if (session?.user?.id) {
    const profile = await prisma.tasteProfile.findUnique({
      where: { userId: session.user.id },
      select: { genreIds: true },
    })
    userGenreIds.push(...(profile?.genreIds ?? []))
  }

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
          {movies.map((m, i) => {
            const movieLike = toMovieLike(m, shared.mediaType)
            const matchScore =
              userGenreIds.length > 0
                ? (calcMatchScore(movieLike.genre_ids ?? [], userGenreIds) ?? undefined)
                : undefined
            const title = shared.mediaType === 'tv' ? (m.name ?? m.title ?? '') : (m.title ?? m.name ?? '')
            const year = (shared.mediaType === 'tv' ? m.first_air_date : m.release_date)?.slice(0, 4)
            const genreNames = (m.genre_ids ?? [])
              .map((id) => MOVIE_GENRES[id] ?? TV_GENRES[id])
              .filter(Boolean) as string[]
            return (
              <div key={m.id} className="flex flex-col gap-2">
                <MovieCard
                  movie={movieLike}
                  providers={null}
                  priority={i === 0}
                  matchScore={matchScore}
                />
                {session && (
                  <AiExplanation title={title} year={year} genres={genreNames} overview={m.overview?.slice(0, 100)} />
                )}
              </div>
            )
          })}
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
