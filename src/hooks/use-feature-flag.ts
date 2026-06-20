'use client'

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

export function useFeatureFlag(flag: string): boolean | undefined {
  const [value, setValue] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (!posthog.__loaded) return

    const check = () => {
      const result = posthog.isFeatureEnabled(flag)
      setValue(result ?? false)
    }

    check()

    posthog.onFeatureFlags(check)
  }, [flag])

  return value
}

export function useFeatureFlagVariant(flag: string): string | boolean | undefined {
  const [value, setValue] = useState<string | boolean | undefined>(undefined)

  useEffect(() => {
    if (!posthog.__loaded) return

    const check = () => {
      const result = posthog.getFeatureFlag(flag)
      setValue(result)
    }

    check()

    posthog.onFeatureFlags(check)
  }, [flag])

  return value
}
