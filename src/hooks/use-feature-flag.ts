'use client'

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

export function useFeatureFlag(flag: string): boolean | undefined {
  const [value, setValue] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const check = () => setValue(posthog.isFeatureEnabled(flag) ?? false)

    if (posthog.__loaded) check()

    return posthog.onFeatureFlags(check)
  }, [flag])

  return value
}

export function useFeatureFlagVariant(flag: string): string | boolean | undefined {
  const [value, setValue] = useState<string | boolean | undefined>(undefined)

  useEffect(() => {
    const check = () => setValue(posthog.getFeatureFlag(flag))

    if (posthog.__loaded) check()

    return posthog.onFeatureFlags(check)
  }, [flag])

  return value
}
