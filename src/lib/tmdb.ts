import 'server-only'

import type {
  TMDBMovieDetails,
  TMDBTVShowDetails,
  TMDBMovieListResponse,
  TMDBTVListResponse,
  WatchProvidersResult,
  TMDBDiscoverMovieParams,
  TMDBDiscoverTVParams,
} from '@/types/tmdb'

const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

function getToken(): string {
  const token = process.env.TMDB_API_READ_TOKEN
  if (!token) throw new Error('TMDB_API_READ_TOKEN is not set')
  return token
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate = 3600
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('language', 'ru-RU')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate },
  })

  if (!res.ok) {
    throw new Error(`TMDB ${res.status}: ${path}`)
  }

  return res.json() as Promise<T>
}

export async function getTrendingMovies(
  timeWindow: 'day' | 'week' = 'week'
): Promise<TMDBMovieListResponse> {
  return tmdbFetch<TMDBMovieListResponse>(`/trending/movie/${timeWindow}`)
}

export async function getTrendingTVShows(
  timeWindow: 'day' | 'week' = 'week'
): Promise<TMDBTVListResponse> {
  return tmdbFetch<TMDBTVListResponse>(`/trending/tv/${timeWindow}`)
}

export async function getMovieDetails(id: number): Promise<TMDBMovieDetails> {
  return tmdbFetch<TMDBMovieDetails>(`/movie/${id}`, {}, 86400)
}

export async function getTVShowDetails(id: number): Promise<TMDBTVShowDetails> {
  return tmdbFetch<TMDBTVShowDetails>(`/tv/${id}`, {}, 86400)
}

export async function getMovieWatchProviders(
  id: number
): Promise<WatchProvidersResult> {
  return tmdbFetch<WatchProvidersResult>(`/movie/${id}/watch/providers`, {}, 86400)
}

export async function getTVWatchProviders(
  id: number
): Promise<WatchProvidersResult> {
  return tmdbFetch<WatchProvidersResult>(`/tv/${id}/watch/providers`, {}, 86400)
}

export async function discoverMovies(
  params: TMDBDiscoverMovieParams
): Promise<TMDBMovieListResponse> {
  const stringParams = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  )
  return tmdbFetch<TMDBMovieListResponse>('/discover/movie', stringParams)
}

export async function discoverTVShows(
  params: TMDBDiscoverTVParams
): Promise<TMDBTVListResponse> {
  const stringParams = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  )
  return tmdbFetch<TMDBTVListResponse>('/discover/tv', stringParams)
}

export function getPosterUrl(
  posterPath: string | null,
  size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string | null {
  if (!posterPath) return null
  return `${IMAGE_BASE_URL}/${size}${posterPath}`
}

export function getBackdropUrl(
  backdropPath: string | null,
  size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
): string | null {
  if (!backdropPath) return null
  return `${IMAGE_BASE_URL}/${size}${backdropPath}`
}

export function getProviderLogoUrl(logoPath: string): string {
  return `${IMAGE_BASE_URL}/w92${logoPath}`
}
