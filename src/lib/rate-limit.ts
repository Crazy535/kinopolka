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
