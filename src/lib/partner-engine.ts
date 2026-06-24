import { randomBytes } from 'crypto'

// Genre intersection for Partner Mode — finds common taste between two users.
// Falls back to union when there's no overlap, so results are never empty.
export function intersectGenres(
  hostIds: number[],
  guestIds: number[]
): number[] {
  const guestSet = new Set(guestIds)
  const common = hostIds.filter((id) => guestSet.has(id))
  if (common.length > 0) return common
  return [...new Set([...hostIds, ...guestIds])]
}

/** Generates a cryptographically random 6-character alphanumeric room code. */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  // chars.length === 32, 256 % 32 === 0 → no modulo bias
  return Array.from(randomBytes(6))
    .map((b) => chars[b % chars.length])
    .join('')
}
