'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

interface Props {
  userId?: string | null
  name?: string | null
}

// Не передаём email в PostHog — это PII (152-ФЗ/GDPR). Идентификатор — userId.
export function PostHogIdentify({ userId, name }: Props) {
  useEffect(() => {
    if (!userId) {
      posthog.reset()
      return
    }
    posthog.identify(userId, {
      ...(name ? { name } : {}),
    })
  }, [userId, name])

  return null
}
