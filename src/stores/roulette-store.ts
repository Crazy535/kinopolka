import { create } from 'zustand'
import type { RecommendationItem } from '@/types/quiz'

interface RouletteState {
  moodIndex: number | null
  result: RecommendationItem | null
  isLoading: boolean
  error: string | null
  ttwStart: number | null
  ttwDuration: number | null
  seenIds: number[]

  setMood: (index: number) => void
  spin: (genreId: number) => Promise<void>
  reset: () => void
  startTTW: () => void
  stopTTW: () => void
}

const initialState = {
  moodIndex: null as number | null,
  result: null as RecommendationItem | null,
  isLoading: false,
  error: null as string | null,
  ttwStart: null as number | null,
  ttwDuration: null as number | null,
  seenIds: [] as number[],
}

export const useRouletteStore = create<RouletteState>((set, get) => ({
  ...initialState,

  setMood: (moodIndex) => set({ moodIndex }),

  spin: async (genreId: number) => {
    set({ isLoading: true, error: null, result: null })
    get().startTTW()

    try {
      const seenIds = get().seenIds
      const excludeParam = seenIds.length > 0
        ? `&exclude_ids=${seenIds.join(',')}`
        : ''

      const res = await fetch(`/api/roulette?genre_id=${genreId}${excludeParam}`)
      if (!res.ok) throw new Error('Failed to fetch roulette result')
      const data = await res.json() as { item: RecommendationItem }

      const newMovieId = data.item.movie.id
      set({
        result: data.item,
        isLoading: false,
        seenIds: [...seenIds, newMovieId],
      })
      get().stopTTW()
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Ошибка загрузки',
        isLoading: false,
      })
    }
  },

  reset: () => set(initialState),

  startTTW: () => set({ ttwStart: performance.now() }),

  stopTTW: () => {
    const start = get().ttwStart
    if (start !== null) set({ ttwDuration: (performance.now() - start) / 1000 })
  },
}))
