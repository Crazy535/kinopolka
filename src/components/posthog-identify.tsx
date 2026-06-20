'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

interface Props {
  userId?: string | null
  name?: string | null
  email?: string | null
}

export function PostHogIdentify({ userId, name, email }: Props) {
  useEffect(() => {
    if (!userId) {
      posthog.reset()
      return
    }
    posthog.identify(userId, {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
    })
  }, [userId, name, email])

  return null
}
