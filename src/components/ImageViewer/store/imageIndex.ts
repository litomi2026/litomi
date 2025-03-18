import { create } from 'zustand'

type Store = {
  imageIndex: number
  getImageIndex: () => number
  setImageIndex: (index: number) => void
  correctImageIndex: () => void
}

export const useImageIndexStore = create<Store>()((set, get) => ({
  imageIndex: 0,
  getImageIndex: () => get().imageIndex,
  setImageIndex: (imageIndex) => set({ imageIndex }),
  correctImageIndex: () => set((state) => ({ imageIndex: Math.max(0, state.imageIndex) })),
}))
