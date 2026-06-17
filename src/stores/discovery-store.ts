import { create } from 'zustand'

interface DiscoveryState {
  seenIds: number[]
  addSeenIds: (ids: number[]) => void
  clearSeenIds: () => void
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  seenIds: [],
  addSeenIds: (ids) =>
    set((s) => ({ seenIds: [...new Set([...s.seenIds, ...ids])] })),
  clearSeenIds: () => set({ seenIds: [] }),
}))
