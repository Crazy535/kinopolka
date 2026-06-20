import 'server-only'
import { Resend } from 'resend'
import type { TMDBMovie } from '@/types/tmdb'
import type { WatchProvidersByType } from '@/types/tmdb'
import { getPosterUrl, getProviderLogoUrl } from '@/lib/tmdb-image'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinopolka.vercel.app'

async function buildUnsubscribeUrl(email: string): Promise<string> {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.AUTH_SECRET ?? ''
  const encoder = new TextEncoder()
  const data = encoder.encode(email + secret)
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, data)
  const token = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${BASE_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}

export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  await resend.emails.send({
    from: FROM,
    to: [email],
    subject: 'Подтвердите email — Кинополка',
    html: `
      <div style="font-family:sans-serif;background:#0A0B14;max-width:480px;margin:0 auto;border-radius:12px;overflow:hidden">
        <div style="background:#C41E3A;height:4px"></div>
        <div style="padding:40px 32px">
          <h1 style="font-family:Georgia,serif;color:#F5F3EF;font-size:26px;font-weight:700;margin:0 0 8px;letter-spacing:-0.02em">
            Добро пожаловать в Кинополку
          </h1>
          <p style="color:#9B9BAD;font-size:15px;line-height:1.6;margin:0 0 28px">
            Подтвердите email, чтобы начать подбор фильмов за&nbsp;30&nbsp;секунд
          </p>
          <a href="${url}" style="display:inline-block;background:#C41E3A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Подтвердить email
          </a>
          <p style="margin:24px 0 0;color:#6B6B7E;font-size:13px;line-height:1.5">
            Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте письмо.
          </p>
        </div>
        <div style="padding:16px 32px;background:#0D0E1C;text-align:center">
          <p style="color:#4A4A5C;font-size:12px;margin:0">Кинополка &bull; kinopolka.vercel.app</p>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  await resend.emails.send({
    from: FROM,
    to: [email],
    subject: 'Сброс пароля — Кинополка',
    html: `
      <div style="font-family:sans-serif;background:#0A0B14;max-width:480px;margin:0 auto;border-radius:12px;overflow:hidden">
        <div style="background:#C41E3A;height:4px"></div>
        <div style="padding:40px 32px">
          <h1 style="font-family:Georgia,serif;color:#F5F3EF;font-size:26px;font-weight:700;margin:0 0 8px;letter-spacing:-0.02em">
            Сброс пароля
          </h1>
          <p style="color:#9B9BAD;font-size:15px;line-height:1.6;margin:0 0 28px">
            Нажмите кнопку ниже, чтобы задать новый пароль. Ссылка действительна 1 час.
          </p>
          <a href="${url}" style="display:inline-block;background:#C41E3A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Сбросить пароль
          </a>
          <p style="margin:24px 0 0;color:#6B6B7E;font-size:13px;line-height:1.5">
            Если вы не запрашивали сброс пароля — просто проигнорируйте письмо.
          </p>
        </div>
        <div style="padding:16px 32px;background:#0D0E1C;text-align:center">
          <p style="color:#4A4A5C;font-size:12px;margin:0">Кинополка &bull; kinopolka.vercel.app</p>
        </div>
      </div>
    `,
  })
}

export async function sendPersonalizedWeeklyEmail(
  email: string,
  movie: TMDBMovie,
  providers: WatchProvidersByType | null,
  genreName?: string,
) {
  return sendWeeklyFilmEmail(email, movie, providers, genreName)
}

export async function sendWeeklyFilmEmail(
  email: string,
  movie: TMDBMovie,
  providers: WatchProvidersByType | null,
  genreName?: string,
) {
  const unsubscribeUrl = await buildUnsubscribeUrl(email)
  const posterUrl = movie.poster_path ? getPosterUrl(movie.poster_path, 'w342') : null
  const year = movie.release_date ? movie.release_date.slice(0, 4) : ''
  const movieUrl = `https://kinopolka.vercel.app/movie/${movie.id}`

  const topProviders = providers
    ? [
        ...(providers.flatrate ?? []),
        ...(providers.free ?? []),
        ...(providers.ads ?? []),
      ].slice(0, 3)
    : []

  const providersHtml = topProviders.length > 0
    ? topProviders
        .map(
          (p) =>
            `<img src="${getProviderLogoUrl(p.logo_path)}" alt="${p.provider_name}" title="${p.provider_name}" width="32" height="32" style="border-radius:6px;margin-right:6px;display:inline-block" />`,
        )
        .join('')
    : ''

  const watchSection = topProviders.length > 0
    ? `<p style="margin:12px 0 4px;color:#9B9BAD;font-size:13px">Смотреть на:</p>
       <div style="margin-bottom:20px">${providersHtml}</div>`
    : ''

  const subjectPrefix = genreName ? `${genreName} · ` : ''

  await resend.emails.send({
    from: FROM,
    to: [email],
    subject: `${subjectPrefix}Фильм недели — ${movie.title}`,
    html: `
      <div style="font-family:sans-serif;background:#0A0B14;max-width:480px;margin:0 auto;border-radius:12px;overflow:hidden">
        <div style="background:#C41E3A;height:4px"></div>
        <div style="padding:32px 32px 0">
          <p style="color:#9B9BAD;font-size:13px;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">${genreName ? `${genreName} · ` : ''}Фильм недели</p>
          ${
            posterUrl
              ? `<img src="${posterUrl}" alt="${movie.title}" width="160" style="border-radius:8px;display:block;margin-bottom:20px;box-shadow:0 8px 24px rgba(0,0,0,0.6)" />`
              : ''
          }
          <h1 style="font-family:Georgia,serif;color:#F5F3EF;font-size:24px;font-weight:700;margin:0 0 4px;letter-spacing:-0.02em">
            ${movie.title}
          </h1>
          ${year ? `<p style="color:#6B6B7E;font-size:14px;margin:0 0 16px">${year}</p>` : ''}
          ${
            movie.overview
              ? `<p style="color:#9B9BAD;font-size:14px;line-height:1.65;margin:0 0 20px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden">${movie.overview}</p>`
              : ''
          }
          ${watchSection}
          <a href="${movieUrl}" style="display:inline-block;background:#C41E3A;color:#fff;padding:13px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:32px">
            Смотреть&nbsp;→
          </a>
        </div>
        <div style="padding:16px 32px;background:#0D0E1C;text-align:center">
          <p style="color:#4A4A5C;font-size:12px;margin:0">
            Кинополка &bull; kinopolka.vercel.app &bull;
            <a href="${unsubscribeUrl}" style="color:#4A4A5C;text-decoration:underline">Отписаться</a>
          </p>
        </div>
      </div>
    `,
  })
}
