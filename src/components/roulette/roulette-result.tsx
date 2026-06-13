'use client'

import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { getPosterUrl, getProviderLogoUrl } from '@/lib/tmdb-image'
import type { RecommendationItem } from '@/types/quiz'
import type { WatchProvider, WatchProvidersByType } from '@/types/tmdb'

function getTitle(item: RecommendationItem['movie']): string {
  return 'title' in item ? item.title : item.name
}

function getYear(item: RecommendationItem['movie']): string {
  const date = 'release_date' in item ? item.release_date : item.first_air_date
  return date ? date.slice(0, 4) : '—'
}

function getRatingClass(score: number): string {
  if (score >= 7.5) return 'text-rating-high'
  if (score >= 6) return 'text-rating-mid'
  return 'text-rating-low'
}

function getTopProviders(providers: WatchProvidersByType | null): WatchProvider[] {
  if (!providers) return []
  const ordered = [
    ...(providers.flatrate ?? []),
    ...(providers.free ?? []),
    ...(providers.ads ?? []),
    ...(providers.rent ?? []),
  ]
  const seen = new Set<number>()
  return ordered.filter((p) => {
    if (seen.has(p.provider_id)) return false
    seen.add(p.provider_id)
    return true
  }).slice(0, 5)
}

interface RouletteResultProps {
  result: RecommendationItem
  ttwDuration: number | null
  onRespin: () => void
  onChangeMood: () => void
}

export function RouletteResult({ result, ttwDuration, onRespin, onChangeMood }: RouletteResultProps) {
  const { movie, providers } = result
  const title = getTitle(movie)
  const year = getYear(movie)
  const posterUrl = getPosterUrl(movie.poster_path, 'w500')
  const topProviders = getTopProviders(providers)
  const ratingClass = getRatingClass(movie.vote_average)
  const fallbackLink =
    providers?.link ??
    `https://www.google.com/search?q=${encodeURIComponent(`${title} смотреть онлайн`)}`

  const isMovie = 'title' in movie
  const detailHref = isMovie ? `/movie/${movie.id}` : `/tv/${movie.id}`

  return (
    <div className="flex flex-col items-center gap-6">
      {ttwDuration !== null && (
        <p className="text-sm text-muted-foreground">
          Подобрали за{' '}
          <span className="font-semibold text-foreground">{ttwDuration.toFixed(1)} сек</span>
        </p>
      )}

      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:max-w-md">
        <div className="relative aspect-[2/3] w-full bg-muted">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Нет постера
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 p-5">
          <div>
            <h2 className="text-xl font-bold leading-tight">{title}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{year}</span>
              {movie.vote_count > 0 && (
                <span className={`font-semibold ${ratingClass}`}>
                  ★ {movie.vote_average.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {movie.overview && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {movie.overview}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Где смотреть
            </p>
            {topProviders.length > 0 ? (
              <a
                href={providers!.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
                aria-label="Открыть страницу просмотра"
              >
                {topProviders.map((p) => (
                  <Image
                    key={p.provider_id}
                    src={getProviderLogoUrl(p.logo_path)}
                    alt={p.provider_name}
                    width={32}
                    height={32}
                    className="rounded-md"
                    title={p.provider_name}
                  />
                ))}
              </a>
            ) : (
              <a
                href={fallbackLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Найти онлайн →
              </a>
            )}
          </div>

          <Link
            href={detailHref}
            className="mt-1 text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
          >
            Подробнее о фильме
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRespin}
          className="flex items-center gap-2 rounded-xl bg-roulette px-6 py-3 text-sm font-semibold text-roulette-foreground transition-opacity hover:opacity-90"
        >
          <RefreshCw className="size-4" />
          Перекрутить
        </button>
        <button
          type="button"
          onClick={onChangeMood}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
        >
          Сменить настроение
        </button>
      </div>
    </div>
  )
}
