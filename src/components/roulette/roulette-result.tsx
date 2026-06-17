'use client'

import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { getPosterUrl, getProviderLogoUrl } from '@/lib/tmdb-image'
import { calcMatchScore } from '@/lib/match-score'
import { MOVIE_GENRES, TV_GENRES } from '@/lib/tmdb-genres'
import { AiExplanation } from '@/components/ai-explanation'
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
  userGenreIds?: number[]
}

export function RouletteResult({ result, ttwDuration, onRespin, onChangeMood, userGenreIds = [] }: RouletteResultProps) {
  const { movie, providers } = result
  const matchScore = userGenreIds.length > 0
    ? (calcMatchScore(movie.genre_ids, userGenreIds) ?? undefined)
    : undefined
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
  const genreNames = (movie.genre_ids ?? [])
    .map((id) => MOVIE_GENRES[id] ?? TV_GENRES[id])
    .filter(Boolean) as string[]

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {ttwDuration !== null && (
        <p className="text-xs text-muted-foreground">
          Подобрали за&nbsp;
          <span className="font-semibold text-gold">{ttwDuration.toFixed(1)}&nbsp;сек</span>
        </p>
      )}

      {/* Mobile — poster + info below */}
      <div className="w-full overflow-hidden rounded-lg bg-card shadow-2xl lg:hidden">
        <div className="relative aspect-[2/3] w-full">
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
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-xs text-muted-foreground">
              Нет постера
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {movie.vote_count > 0 && (
            <div className={`absolute right-3 top-3 rounded-md bg-black/50 px-2 py-1 text-xs font-bold backdrop-blur-sm ${ratingClass}`}>
              ★&nbsp;{movie.vote_average.toFixed(1)}
            </div>
          )}
          {typeof matchScore === 'number' && matchScore >= 60 && (
            <div className="pointer-events-none absolute left-3 top-3">
              <span className={`inline-flex items-center rounded px-1.5 py-[3px] text-[11px] font-bold leading-none backdrop-blur-sm shadow-sm ${
                matchScore >= 80 ? 'bg-emerald-500/85 text-white' : 'bg-amber-500/85 text-white'
              }`}>
                {matchScore}%
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <h2 className="text-base font-bold leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{year}</p>
          {movie.overview && (
            <p className="text-xs leading-relaxed text-foreground/70 line-clamp-4">{movie.overview}</p>
          )}
          <div className="mt-1">
            {topProviders.length > 0 ? (
              <a
                href={providers!.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
                aria-label="Где смотреть"
              >
                {topProviders.map((p) => (
                  <Image
                    key={p.provider_id}
                    src={getProviderLogoUrl(p.logo_path)}
                    alt={p.provider_name}
                    width={28}
                    height={28}
                    className="rounded-md shadow-sm"
                    title={p.provider_name}
                  />
                ))}
              </a>
            ) : (
              <a
                href={fallbackLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Найти онлайн&nbsp;→
              </a>
            )}
          </div>
          <Link href={detailHref} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            {isMovie ? 'Подробнее о фильме' : 'Подробнее о сериале'}&nbsp;→
          </Link>
        </div>
      </div>

      {/* Desktop — horizontal card */}
      <div className="hidden w-full max-w-2xl overflow-hidden rounded-xl bg-card shadow-2xl lg:flex">
        {/* Poster */}
        <div className="relative h-[320px] w-[200px] flex-shrink-0">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="200px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              Нет постера
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex flex-1 flex-col justify-between p-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {movie.vote_count > 0 && (
                <span className={`text-sm font-bold ${ratingClass}`}>
                  ★&nbsp;{movie.vote_average.toFixed(1)}
                </span>
              )}
              {typeof matchScore === 'number' && matchScore >= 60 && (
                <span className={`inline-flex items-center rounded px-1.5 py-[3px] text-[11px] font-bold leading-none ${
                  matchScore >= 80 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {matchScore}% совпадение
                </span>
              )}
            </div>
            <h2 className="font-heading text-2xl font-bold leading-tight tracking-[-0.02em]">{title}</h2>
            <p className="text-sm text-muted-foreground">{year}</p>
            {movie.overview && (
              <p className="mt-2 text-sm leading-relaxed text-foreground/75 line-clamp-5">{movie.overview}</p>
            )}
            <div className="mt-3">
              <AiExplanation title={title} year={year !== '—' ? year : undefined} genres={genreNames} />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {topProviders.length > 0 ? (
              <a
                href={providers!.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
                aria-label="Где смотреть"
              >
                {topProviders.map((p) => (
                  <Image
                    key={p.provider_id}
                    src={getProviderLogoUrl(p.logo_path)}
                    alt={p.provider_name}
                    width={36}
                    height={36}
                    className="rounded-lg shadow-sm"
                    title={p.provider_name}
                  />
                ))}
              </a>
            ) : (
              <a
                href={fallbackLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Найти онлайн&nbsp;→
              </a>
            )}
            <Link href={detailHref} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {isMovie ? 'Подробнее о фильме' : 'Подробнее о сериале'}&nbsp;→
            </Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRespin}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-bold text-gold-foreground transition-all duration-200 hover:opacity-90 hover:shadow-[0_4px_16px_oklch(0.80_0.13_80_/_0.30)] sm:w-auto"
        >
          <RefreshCw className="size-4" />
          Перекрутить
        </button>
        <button
          type="button"
          onClick={onChangeMood}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Сменить настроение
        </button>
      </div>
    </div>
  )
}
