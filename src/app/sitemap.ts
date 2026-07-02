import type { MetadataRoute } from 'next'
import { getPopularMovies, getPopularTVShows } from '@/lib/tmdb'

const BASE_URL = 'https://kinopolka.vercel.app'

// Фиксированная дата вместо new Date(): иначе краулер считает, что каждая
// статическая страница «обновилась» при каждой регенерации sitemap.
const LAST_MODIFIED = new Date('2026-07-02')

// Сколько страниц TMDB тянуть для динамической части (20 элементов на страницу).
const CONTENT_PAGES = 3

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: LAST_MODIFIED, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/quiz`, lastModified: LAST_MODIFIED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/roulette`, lastModified: LAST_MODIFIED, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/partner`, lastModified: LAST_MODIFIED, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/search`, lastModified: LAST_MODIFIED, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/register`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Динамическая часть — топ фильмов/сериалов. TMDB может быть недоступен на
  // регенерации: тогда деградируем до статического sitemap, не роняя роут.
  let contentRoutes: MetadataRoute.Sitemap = []
  try {
    const pages = Array.from({ length: CONTENT_PAGES }, (_, i) => i + 1)
    const [moviePages, tvPages] = await Promise.all([
      Promise.all(pages.map((p) => getPopularMovies(p))),
      Promise.all(pages.map((p) => getPopularTVShows(p))),
    ])

    const movieRoutes = moviePages
      .flatMap((r) => r.results)
      .map((m) => ({
        url: `${BASE_URL}/movie/${m.id}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))

    const tvRoutes = tvPages
      .flatMap((r) => r.results)
      .map((s) => ({
        url: `${BASE_URL}/tv/${s.id}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))

    contentRoutes = [...movieRoutes, ...tvRoutes]
  } catch {
    contentRoutes = []
  }

  return [...staticRoutes, ...contentRoutes]
}
