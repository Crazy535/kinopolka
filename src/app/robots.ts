import type { MetadataRoute } from 'next'

const BASE_URL = 'https://kinopolka.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/profile',
          '/watchlist',
          '/diary',
          '/partner/',
          '/verify-email',
          '/onboarding',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
