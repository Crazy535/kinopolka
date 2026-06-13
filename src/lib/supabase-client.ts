'use client'

import { createClient } from '@supabase/supabase-js'

// Singleton for client-side Realtime subscriptions only.
// All data reads/writes go through API routes + Prisma, never via this client.
let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}
