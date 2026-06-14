import 'server-only'

import type {
  TMDBMovieDetails,
  TMDBTVShowDetails,
  TMDBMovieDetailsEnriched,
  TMDBTVShowDetailsEnriched,
  TMDBMovieListResponse,
  TMDBTVListResponse,
  WatchProvidersResult,
  TMDBDiscoverMovieParams,
  TMDBDiscoverTVParams,
  TMDBPersonSearchResponse,
  TMDBPersonDetails,
  TMDBPersonCombinedCredits,
  TMDBSearchMultiResponse,
} from '@/types/tmdb'

const BASE_URL = 'https://api.themoviedb.org/3'

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

export async function getMovieDetailsEnriched(id: number): Promise<TMDBMovieDetailsEnriched> {
  return tmdbFetch<TMDBMovieDetailsEnriched>(
    `/movie/${id}`,
    { append_to_response: 'credits,watch/providers' },
    86400
  )
}

export async function getTVShowDetailsEnriched(id: number): Promise<TMDBTVShowDetailsEnriched> {
  return tmdbFetch<TMDBTVShowDetailsEnriched>(
    `/tv/${id}`,
    { append_to_response: 'credits,watch/providers' },
    86400
  )
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

export async function searchPersons(query: string): Promise<TMDBPersonSearchResponse> {
  return tmdbFetch<TMDBPersonSearchResponse>('/search/person', { query }, 0)
}

export async function getOnboardingPosters(): Promise<TMDBMovieListResponse['results']> {
  const [page1, page2] = await Promise.all([
    tmdbFetch<TMDBMovieListResponse>('/movie/popular', { page: '1' }, 86400),
    tmdbFetch<TMDBMovieListResponse>('/movie/popular', { page: '2' }, 86400),
  ])
  return [...page1.results, ...page2.results]
    .filter((m) => !!m.poster_path)
    .slice(0, 40)
}

export async function getPersonDetails(id: number): Promise<TMDBPersonDetails> {
  return tmdbFetch<TMDBPersonDetails>(`/person/${id}`, {}, 86400)
}

export async function getPersonCombinedCredits(id: number): Promise<TMDBPersonCombinedCredits> {
  return tmdbFetch<TMDBPersonCombinedCredits>(`/person/${id}/combined_credits`, {}, 86400)
}

export async function getMovieRecommendations(id: number): Promise<TMDBMovieListResponse> {
  return tmdbFetch<TMDBMovieListResponse>(`/movie/${id}/recommendations`, {}, 86400)
}

export async function getTVRecommendations(id: number): Promise<TMDBTVListResponse> {
  return tmdbFetch<TMDBTVListResponse>(`/tv/${id}/recommendations`, {}, 86400)
}

export async function searchMulti(query: string, page = 1): Promise<TMDBSearchMultiResponse> {
  return tmdbFetch<TMDBSearchMultiResponse>(
    '/search/multi',
    { query, include_adult: 'false', page: String(page) },
    60
  )
}

export { getPosterUrl, getBackdropUrl, getProviderLogoUrl } from './tmdb-image'
