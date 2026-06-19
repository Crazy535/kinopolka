import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Кинополка — что посмотреть сегодня?',
    short_name: 'Кинополка',
    description: 'Подберём фильм или сериал за 30 секунд. Квиз, рулетка, совместный выбор.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0d14',
    theme_color: '#0b0d14',
    orientation: 'portrait',
    categories: ['entertainment'],
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
