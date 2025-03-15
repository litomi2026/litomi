import { create } from 'zustand'

type Store = {
  slideshowInterval: number
  setSlideshowInterval: (a: number | ((prev: number) => number)) => void
}

export const useSlideshowStore = create<Store>()((set) => ({
  slideshowInterval: 0,
  setSlideshowInterval: (slideshowInterval) =>
    set((state) => ({
      slideshowInterval:
        typeof slideshowInterval === 'function' ? slideshowInterval(state.slideshowInterval) : slideshowInterval,
    })),
}))
