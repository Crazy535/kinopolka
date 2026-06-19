import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface DiscoveryState {
  seenIds: number[]
  addSeenIds: (ids: number[]) => void
  clearSeenIds: () => void
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set) => ({
      seenIds: [],
      addSeenIds: (ids) =>
        set((s) => ({ seenIds: [...new Set([...s.seenIds, ...ids])] })),
      clearSeenIds: () => set({ seenIds: [] }),
    }),
    {
      name: 'kinopolka-discovery',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
