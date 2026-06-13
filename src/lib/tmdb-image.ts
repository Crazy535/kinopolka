const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

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
