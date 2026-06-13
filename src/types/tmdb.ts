export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  original_language: string
  adult: boolean
  video: boolean
}

export interface TMDBTVShow {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  original_language: string
  origin_country: string[]
}

export interface TMDBMovieDetails extends Omit<TMDBMovie, 'genre_ids'> {
  runtime: number | null
  budget: number
  revenue: number
  status: string
  tagline: string | null
  homepage: string | null
  imdb_id: string | null
  genres: TMDBGenre[]
  production_countries: TMDBProductionCountry[]
  spoken_languages: TMDBSpokenLanguage[]
}

export interface TMDBTVShowDetails extends Omit<TMDBTVShow, 'genre_ids'> {
  number_of_seasons: number
  number_of_episodes: number
  status: string
  tagline: string | null
  homepage: string | null
  genres: TMDBGenre[]
  networks: TMDBNetwork[]
  production_countries: TMDBProductionCountry[]
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBProductionCountry {
  iso_3166_1: string
  name: string
}

export interface TMDBSpokenLanguage {
  iso_639_1: string
  name: string
  english_name: string
}

export interface TMDBNetwork {
  id: number
  name: string
  logo_path: string | null
  origin_country: string
}

export interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority: number
}

export interface WatchProvidersByType {
  flatrate?: WatchProvider[]
  rent?: WatchProvider[]
  buy?: WatchProvider[]
  free?: WatchProvider[]
  ads?: WatchProvider[]
  link: string
}

export interface WatchProvidersResult {
  id: number
  results: Record<string, WatchProvidersByType>
}

export interface TMDBPaginatedResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export type TMDBMovieListResponse = TMDBPaginatedResponse<TMDBMovie>
export type TMDBTVListResponse = TMDBPaginatedResponse<TMDBTVShow>

export interface TMDBDiscoverMovieParams {
  language?: string
  page?: number
  sort_by?: string
  with_genres?: string
  without_genres?: string
  "vote_average.gte"?: number
  "vote_count.gte"?: number
  "with_runtime.lte"?: number
  "with_runtime.gte"?: number
  with_original_language?: string
  region?: string
  watch_region?: string
  with_watch_providers?: string
}

export interface TMDBDiscoverTVParams {
  language?: string
  page?: number
  sort_by?: string
  with_genres?: string
  without_genres?: string
  "vote_average.gte"?: number
  "vote_count.gte"?: number
  with_original_language?: string
}
