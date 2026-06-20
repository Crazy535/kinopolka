import 'server-only'
import { PostHog } from 'posthog-node'

function makeClient() {
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '', {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
}

export async function getServerFeatureFlag(
  flag: string,
  distinctId: string,
): Promise<string | boolean | undefined> {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return undefined
  const client = makeClient()
  try {
    const value = await client.getFeatureFlag(flag, distinctId)
    return value ?? undefined
  } catch {
    return undefined
  } finally {
    await client.shutdown()
  }
}

export async function isServerFeatureFlagEnabled(
  flag: string,
  distinctId: string,
): Promise<boolean> {
  const value = await getServerFeatureFlag(flag, distinctId)
  return value === true || value === 'true'
}
