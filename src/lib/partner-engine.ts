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

/** Generates a random 6-character alphanumeric room code. */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
