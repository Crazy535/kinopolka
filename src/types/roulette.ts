import type { TMDBMovieDetailsEnriched, TMDBTVShowDetailsEnriched, WatchProvidersByType } from './tmdb'

export type RouletteItem =
  | { type: 'movie'; data: TMDBMovieDetailsEnriched; providers: WatchProvidersByType | null }
  | { type: 'tv'; data: TMDBTVShowDetailsEnriched; providers: WatchProvidersByType | null }
