import posthog from 'posthog-js'

const TTW_START_KEY = 'kinopolka_ttw_start'

type UserType = 'anon' | 'auth'

export function setTTWStart() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TTW_START_KEY, String(Date.now()))
  }
}

export function getTTWDurationMs(): number | null {
  if (typeof window === 'undefined') return null
  const start = localStorage.getItem(TTW_START_KEY)
  if (!start) return null
  return Date.now() - Number(start)
}

export function clearTTWStart() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TTW_START_KEY)
  }
}

export function trackTTWStart(userType: UserType, entryPage: string) {
  setTTWStart()
  posthog.capture('ttw_session_start', { user_type: userType, entry_page: entryPage })
}

export function trackTTWCompleted(userType: UserType, method: 'watchlist' | 'provider') {
  const durationMs = getTTWDurationMs()
  clearTTWStart()
  posthog.capture('ttw_completed', { user_type: userType, duration_ms: durationMs, method })
}

export function trackQuizStep(step: number, userType: UserType) {
  posthog.capture('quiz_step', { step, user_type: userType })
}

export function trackQuizCompleted(resultCount: number, userType: UserType) {
  posthog.capture('quiz_completed', { result_count: resultCount, user_type: userType })
}

export function trackRouletteSpun(userType: UserType) {
  posthog.capture('roulette_spun', { user_type: userType })
}

export function trackPartnerRoomCreated() {
  posthog.capture('partner_room_created')
}

export function trackSearchUsed(queryLength: number, resultCount: number) {
  posthog.capture('search_used', { query_length: queryLength, result_count: resultCount })
}
