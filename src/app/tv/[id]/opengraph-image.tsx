import { ImageResponse } from 'next/og'
import { getTVShowDetailsEnriched } from '@/lib/tmdb'
import { getPosterUrl } from '@/lib/tmdb-image'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OGImage({ params }: Props) {
  const { id } = await params
  const tvId = Number(id)

  let title = 'Сериал'
  let year = ''
  let genres: string[] = []
  let rating = ''
  let seasons: number | null = null
  let posterUrl: string | null = null

  try {
    const show = await getTVShowDetailsEnriched(tvId)
    title = show.name
    year = show.first_air_date ? show.first_air_date.slice(0, 4) : ''
    genres = show.genres?.slice(0, 3).map((g) => g.name) ?? []
    rating = show.vote_count > 0 ? show.vote_average.toFixed(1) : ''
    seasons = show.number_of_seasons ?? null
    posterUrl = getPosterUrl(show.poster_path, 'w342')
  } catch {
    // render fallback
  }

  const posterData = posterUrl
    ? await fetch(posterUrl)
        .then((r) => r.arrayBuffer())
        .then((buf) => `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`)
        .catch(() => null)
    : null

  const seasonsLabel = seasons
    ? `${seasons} ${seasons === 1 ? 'сезон' : seasons < 5 ? 'сезона' : 'сезонов'}`
    : null

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0D0F1B',
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Blue top bar (TV) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3246BE 0%, #1a2580 100%)',
          }}
        />

        {/* Poster */}
        {posterData && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '380px',
              display: 'flex',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterData}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, #0D0F1B 0%, transparent 40%)',
              }}
            />
          </div>
        )}

        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-180px',
            left: '-80px',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(50,70,190,0.18) 0%, transparent 65%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '72px 80px',
            maxWidth: posterData ? '750px' : '100%',
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: '15px',
              letterSpacing: '0.18em',
              color: '#5068D8',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            КИНОПОЛКА · СЕРИАЛ
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 30 ? '54px' : '72px',
              fontWeight: 700,
              color: '#F4F5F9',
              fontFamily: 'Georgia, serif',
              letterSpacing: '-1.5px',
              lineHeight: 1.08,
              marginBottom: '16px',
            }}
          >
            {title}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: genres.length > 0 ? '20px' : '0',
            }}
          >
            {year && (
              <span
                style={{
                  fontSize: '22px',
                  color: 'rgba(244,245,249,0.55)',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {year}
              </span>
            )}
            {seasonsLabel && (
              <span
                style={{
                  fontSize: '22px',
                  color: 'rgba(244,245,249,0.55)',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {seasonsLabel}
              </span>
            )}
            {rating && (
              <span
                style={{
                  fontSize: '22px',
                  color: '#F4C542',
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                }}
              >
                ★ {rating}
              </span>
            )}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {genres.map((g) => (
                <div
                  key={g}
                  style={{
                    background: 'rgba(50,70,190,0.22)',
                    border: '1px solid rgba(80,100,200,0.35)',
                    borderRadius: '6px',
                    padding: '6px 16px',
                    fontSize: '18px',
                    color: 'rgba(244,245,249,0.75)',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {g}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '68px',
            right: posterData ? '420px' : '80px',
            fontSize: '16px',
            color: 'rgba(244,245,249,0.25)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          kinopolka.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
