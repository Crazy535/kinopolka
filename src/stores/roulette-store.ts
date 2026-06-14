import { create } from 'zustand'
import type { RecommendationItem } from '@/types/quiz'

interface RouletteState {
  contentType: 'movie' | 'tv' | null
  moodIndex: number | null
  result: RecommendationItem | null
  isLoading: boolean
  error: string | null
  ttwStart: number | null
  ttwDuration: number | null
  seenIds: number[]

  setContentType: (type: 'movie' | 'tv') => void
  setMood: (index: number) => void
  spin: (genreId: number, contentType: 'movie' | 'tv') => Promise<void>
  reset: () => void
  startTTW: () => void
  stopTTW: () => void
}

const initialState = {
  contentType: null as 'movie' | 'tv' | null,
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

  setContentType: (contentType) =>
    set({ contentType, moodIndex: null, seenIds: [], result: null, error: null }),

  setMood: (moodIndex) => set({ moodIndex }),

  spin: async (genreId: number, contentType: 'movie' | 'tv') => {
    set({ isLoading: true, error: null, result: null })
    get().startTTW()

    try {
      const seenIds = get().seenIds
      const excludeParam = seenIds.length > 0
        ? `&exclude_ids=${seenIds.join(',')}`
        : ''

      const res = await fetch(`/api/roulette?genre_id=${genreId}&type=${contentType}${excludeParam}`)
      if (!res.ok) throw new Error('Failed to fetch roulette result')
      const data = await res.json() as { item: RecommendationItem }

      const newId = data.item.movie.id
      set({
        result: data.item,
        isLoading: false,
        seenIds: [...seenIds, newId],
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
