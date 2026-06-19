import 'server-only'

import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

export async function withTmdbCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = 86400
): Promise<T> {
  const client = getRedis()
  if (!client) return fn()

  try {
    const cached = await client.get<T>(`tmdb:${key}`)
    if (cached !== null && cached !== undefined) return cached

    const result = await fn()
    await client.set(`tmdb:${key}`, result, { ex: ttl })
    return result
  } catch {
    return fn()
  }
}
