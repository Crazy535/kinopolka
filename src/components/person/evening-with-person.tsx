'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Moon, Star, Film } from 'lucide-react'
import { getPosterUrl } from '@/lib/tmdb-image'
import type { EveningWithResponse, EveningFilm } from '@/app/api/evening-with/[id]/route'

type Filter = 'all' | 'short' | 'medium' | 'long'

const FILTERS: { key: Filter; label: string; hint: string }[] = [
  { key: 'all', label: 'Все', hint: '' },
  { key: 'short', label: '≤90 мин', hint: 'Короткие' },
  { key: 'medium', label: '90–150 мин', hint: 'Средние' },
  { key: 'long', label: '150+ мин', hint: 'Длинные' },
]

function formatRuntime(minutes: number | null): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

function EveningFilmCard({ film }: { film: EveningFilm }) {
  const year = film.release_date ? film.release_date.slice(0, 4) : ''
  const posterUrl = getPosterUrl(film.poster_path, 'w342')
  const ratingClass =
    film.vote_average >= 7.5
      ? 'text-rating-high'
      : film.vote_average >= 6
        ? 'text-rating-mid'
        : 'text-rating-low'

  return (
    <Link href={`/movie/${film.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={film.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Film className="size-7" strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
          <Star className="size-3 fill-gold text-gold" />
          <span className={ratingClass}>{film.vote_average.toFixed(1)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary transition-colors">
          {film.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {year && <span>{year}</span>}
          {film.runtime && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Clock className="size-3" />
                {formatRuntime(film.runtime)}
              </span>
            </>
          )}
        </div>
        {film.providers_ru.length > 0 && (
          <p className="text-[11px] text-muted-foreground truncate">{film.providers_ru.join(' · ')}</p>
        )}
      </div>
    </Link>
  )
}

function EveningFilmCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
      <div className="flex flex-col gap-1.5 px-0.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

interface Props {
  personId: number
  personName: string
}

export function EveningWithPerson({ personId, personName }: Props) {
  const [data, setData] = useState<EveningWithResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetch(`/api/evening-with/${personId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: EveningWithResponse | null) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [personId])

  if (!loading && (!data || data.films.length === 0)) return null

  const filtered: EveningFilm[] =
    !data
      ? []
      : filter === 'all'
        ? data.films
        : data.grouped[filter] ?? []

  const hasFilter = (key: Exclude<Filter, 'all'>) => (data?.grouped[key]?.length ?? 0) > 0

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-center gap-2.5">
        <Moon className="size-5 text-primary shrink-0" />
        <h2 className="font-heading text-xl font-bold sm:text-2xl">
          Вечер с {personName}
        </h2>
      </div>

      {/* Runtime filter tabs */}
      {!loading && data && (
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => {
            if (key !== 'all' && !hasFilter(key as Exclude<Filter, 'all'>)) return null
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                  filter === key
                    ? 'bg-primary text-primary-foreground shadow-[0_0_14px_oklch(0.58_0.22_18_/_0.25)]'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                {label}
                {key !== 'all' && data.grouped[key] && (
                  <span className="ml-1.5 text-[11px] opacity-70">{data.grouped[key]!.length}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <EveningFilmCardSkeleton key={i} />)
          : filtered.map((film) => <EveningFilmCard key={film.id} film={film} />)}
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Нет фильмов для этого фильтра.</p>
      )}
    </section>
  )
}
