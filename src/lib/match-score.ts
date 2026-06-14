export function calcMatchScore(movieGenreIds: number[], userGenreIds: number[]): number | null {
  if (userGenreIds.length === 0 || movieGenreIds.length === 0) return null
  const userSet = new Set(userGenreIds)
  const intersection = movieGenreIds.filter((id) => userSet.has(id)).length
  const denominator = Math.max(movieGenreIds.length, 3)
  return Math.round((intersection / denominator) * 100)
}
