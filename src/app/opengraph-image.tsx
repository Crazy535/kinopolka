import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Кинополка — что посмотреть сегодня?'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0D0F1B',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top crimson accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #C8392B 0%, #8B1C1C 100%)',
          }}
        />

        {/* Radial glow — top right */}
        <div
          style={{
            position: 'absolute',
            top: '-180px',
            right: '-120px',
            width: '680px',
            height: '680px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(200,57,43,0.14) 0%, transparent 65%)',
          }}
        />

        {/* Radial glow — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-160px',
            left: '-80px',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(50,60,140,0.22) 0%, transparent 65%)',
          }}
        />

        {/* Content block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
          }}
        >
          {/* Eyebrow label */}
          <div
            style={{
              fontSize: '17px',
              letterSpacing: '0.18em',
              color: '#C8392B',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '18px',
            }}
          >
            КИНОПОЛКА
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: '82px',
              fontWeight: 700,
              color: '#F4F5F9',
              fontFamily: 'Georgia, serif',
              letterSpacing: '-2px',
              lineHeight: 1.04,
              marginBottom: '22px',
            }}
          >
            {'Что смотрим\nсегодня?'}
          </div>

          {/* Subline */}
          <div
            style={{
              fontSize: '26px',
              color: 'rgba(244,245,249,0.52)',
              fontFamily: 'system-ui, sans-serif',
              marginBottom: '40px',
            }}
          >
            Квиз за 30 секунд — и фильм найден
          </div>

          {/* Mode badges */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { label: 'Фильм', bg: 'rgba(200,57,43,0.18)', border: 'rgba(200,57,43,0.40)' },
              { label: 'Сериал', bg: 'rgba(50,60,140,0.22)', border: 'rgba(80,90,180,0.35)' },
              { label: 'Кинорулетка', bg: 'rgba(200,164,40,0.18)', border: 'rgba(200,164,40,0.38)' },
              { label: 'С партнёром', bg: 'rgba(40,110,90,0.20)', border: 'rgba(40,140,110,0.35)' },
            ].map(({ label, bg, border }) => (
              <div
                key={label}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: '8px',
                  padding: '10px 22px',
                  fontSize: '20px',
                  color: 'rgba(244,245,249,0.78)',
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* URL — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: '68px',
            right: '80px',
            fontSize: '17px',
            color: 'rgba(244,245,249,0.28)',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          kinopolka.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
