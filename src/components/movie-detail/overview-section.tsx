'use client'

import { useState } from 'react'
import type { TMDBProductionCountry } from '@/types/tmdb'

const COUNTRY_EMOJI: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', IT: '🇮🇹',
  ES: '🇪🇸', JP: '🇯🇵', KR: '🇰🇷', CN: '🇨🇳', IN: '🇮🇳',
  RU: '🇷🇺', BR: '🇧🇷', AU: '🇦🇺', CA: '🇨🇦', MX: '🇲🇽',
  SE: '🇸🇪', DK: '🇩🇰', NO: '🇳🇴', FI: '🇫🇮', NL: '🇳🇱',
  BE: '🇧🇪', AT: '🇦🇹', CH: '🇨🇭', PL: '🇵🇱', CZ: '🇨🇿',
  HU: '🇭🇺', IL: '🇮🇱', TR: '🇹🇷', AR: '🇦🇷', HK: '🇭🇰',
  TW: '🇹🇼', TH: '🇹🇭', NG: '🇳🇬', ZA: '🇿🇦', IE: '🇮🇪',
  NZ: '🇳🇿', PT: '🇵🇹', GR: '🇬🇷', RO: '🇷🇴', UA: '🇺🇦',
}

const COLLAPSE_THRESHOLD = 400

interface OverviewSectionProps {
  overview: string
  tagline?: string | null
  countries?: TMDBProductionCountry[]
  episodeInfo?: string
}

export function OverviewSection({ overview, tagline, countries, episodeInfo }: OverviewSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = overview.length > COLLAPSE_THRESHOLD

  return (
    <div className="flex flex-col gap-3">
      {tagline && (
        <p className="font-serif text-sm italic text-muted-foreground">«{tagline}»</p>
      )}

      {overview && (
        <div>
          <p
            className={`text-sm leading-relaxed text-foreground/80 sm:text-base ${
              isLong && !expanded ? 'line-clamp-4' : ''
            }`}
          >
            {overview}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-medium text-primary transition-opacity hover:opacity-80"
            >
              {expanded ? 'Свернуть' : 'Читать далее'}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {episodeInfo && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            {episodeInfo}
          </span>
        )}
        {countries?.slice(0, 3).map((c) => (
          <span
            key={c.iso_3166_1}
            className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
          >
            {COUNTRY_EMOJI[c.iso_3166_1] ?? ''} {c.name}
          </span>
        ))}
      </div>
    </div>
  )
}
