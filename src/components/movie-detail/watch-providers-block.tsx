'use client'

import Image from 'next/image'
import { getProviderLogoUrl } from '@/lib/tmdb-image'
import type { WatchProvidersByType, WatchProvider } from '@/types/tmdb'
import { trackTTWCompleted } from '@/lib/analytics'

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
  }).slice(0, 6)
}

interface WatchProvidersBlockProps {
  providers: WatchProvidersByType | null
  title: string
  userType?: 'anon' | 'auth'
}

export function WatchProvidersBlock({ providers, title, userType = 'anon' }: WatchProvidersBlockProps) {
  const topProviders = getTopProviders(providers)
  const fallbackLink = `https://www.google.com/search?q=${encodeURIComponent(`${title} смотреть онлайн`)}`

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Где смотреть
      </p>
      {topProviders.length > 0 ? (
        <a
          href={providers!.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-wrap gap-3"
          aria-label="Открыть страницу просмотра"
          onClick={() => trackTTWCompleted(userType, 'provider')}
        >
          {topProviders.map((p) => (
            <div key={p.provider_id} className="flex flex-col items-center gap-1">
              <Image
                src={getProviderLogoUrl(p.logo_path)}
                alt={p.provider_name}
                width={40}
                height={40}
                className="rounded-lg"
                title={p.provider_name}
              />
              <span className="max-w-[48px] truncate text-center text-[10px] text-muted-foreground">
                {p.provider_name}
              </span>
            </div>
          ))}
        </a>
      ) : (
        <a
          href={fallbackLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => trackTTWCompleted(userType, 'provider')}
        >
          Найти онлайн →
        </a>
      )}
    </div>
  )
}
