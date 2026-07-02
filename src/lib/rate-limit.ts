import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      prefix: 'rl:ai',
    })
  : null

export async function checkRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (!ratelimit) {
    return { success: true, remaining: 99, reset: 0 }
  }

  const result = await ratelimit.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * Извлекает клиентский IP из заголовков прокси (Vercel/edge) для rate-limit
 * анонимных роутов. Fallback 'anon' — общий bucket для запросов без IP.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anon'
  )
}

/**
 * Стандартный 429-ответ с Retry-After. Возвращать при `!rl.success`.
 */
export function rateLimitResponse(rl: { remaining: number; reset: number }): Response {
  return Response.json(
    { error: 'Too many requests. Try again in a minute.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))),
        'X-RateLimit-Remaining': String(rl.remaining),
      },
    }
  )
}
