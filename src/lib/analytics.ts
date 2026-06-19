import posthog from 'posthog-js'

const TTW_START_KEY = 'kinopolka_ttw_start'
const TTW_FLOW_KEY = 'kinopolka_ttw_flow'

type UserType = 'anon' | 'auth'
type TTWFlow = 'quiz' | 'roulette' | 'partner'

export function setTTWStart(flow: TTWFlow) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TTW_START_KEY, String(Date.now()))
    localStorage.setItem(TTW_FLOW_KEY, flow)
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
    localStorage.removeItem(TTW_FLOW_KEY)
  }
}

export function trackTTWStart(userType: UserType, entryPage: string, flow: TTWFlow = 'quiz') {
  setTTWStart(flow)
  posthog.capture('ttw_session_start', { user_type: userType, entry_page: entryPage, flow })
}

export function trackTTWCompleted(userType: UserType, method: 'watchlist' | 'provider') {
  const durationMs = getTTWDurationMs()
  const flow = typeof window !== 'undefined' ? localStorage.getItem(TTW_FLOW_KEY) : null
  clearTTWStart()
  posthog.capture('ttw_completed', { user_type: userType, duration_ms: durationMs, method, flow })
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
