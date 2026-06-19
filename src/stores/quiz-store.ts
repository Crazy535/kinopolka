import { create } from 'zustand'
import type { ContentType, RuntimeOption, RecommendationItem } from '@/types/quiz'

interface QuizState {
  step: number
  type: ContentType | null
  moodIndex: number | null
  runtime: RuntimeOption | null
  results: RecommendationItem[]
  isLoading: boolean
  error: string | null
  ttwStart: number | null
  ttwDuration: number | null

  setType: (type: ContentType) => void
  setMood: (index: number) => void
  setRuntime: (runtime: RuntimeOption) => void
  setResults: (results: RecommendationItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
  goBack: () => void
  startTTW: () => void
  stopTTW: () => void
}

const initialState = {
  step: 0,
  type: null as ContentType | null,
  moodIndex: null as number | null,
  runtime: null as RuntimeOption | null,
  results: [] as RecommendationItem[],
  isLoading: false,
  error: null as string | null,
  ttwStart: null as number | null,
  ttwDuration: null as number | null,
}

export const useQuizStore = create<QuizState>((set, get) => ({
  ...initialState,

  setType: (type) => set({ type, step: 1 }),

  setMood: (moodIndex) =>
    set((state) => ({
      moodIndex,
      step: state.type === 'tv' ? 3 : 2,
    })),

  setRuntime: (runtime) => set({ runtime, step: 3 }),

  setResults: (results) => set({ results, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  reset: () => set(initialState),

  goBack: () =>
    set((state) => {
      if (state.step === 1) return { step: 0, type: null }
      if (state.step === 2) return { step: 1, moodIndex: null }
      return {}
    }),

  startTTW: () => set({ ttwStart: performance.now() }),

  stopTTW: () => {
    const start = get().ttwStart
    if (start !== null) set({ ttwDuration: (performance.now() - start) / 1000 })
  },
}))
