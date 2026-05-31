import { create } from 'zustand'

type Store = {
  isLive: boolean
  setIsLive: (isLive: boolean) => void
}

export const useRealtimeStore = create<Store>()((set) => ({
  isLive: true,
  setIsLive: (isLive: boolean) => set({ isLive }),
}))
