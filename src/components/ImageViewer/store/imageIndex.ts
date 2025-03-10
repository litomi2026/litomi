import { create } from 'zustand'

type Store = {
  imageIndex: number
  setImageIndex: (index: number) => void
  correctImageIndex: () => void
}

export const useImageIndexStore = create<Store>()((set) => ({
  imageIndex: 0,
  setImageIndex: (imageIndex) => set({ imageIndex }),
  correctImageIndex: () => set((state) => ({ imageIndex: Math.max(0, state.imageIndex) })),
}))
