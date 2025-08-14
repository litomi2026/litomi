import { create } from 'zustand'

import { MangaIdSearchParam } from '@/app/manga/[id]/common'

type Store = {
  imageIndex: number
  getImageIndex: () => number
  setImageIndex: (index: number) => void
  navigateToImageIndex: (index: number) => void
  correctImageIndex: () => void
}

export const useImageIndexStore = create<Store>()((set, get) => ({
  imageIndex: 0,
  getImageIndex: () => get().imageIndex,
  setImageIndex: (imageIndex) => set({ imageIndex }),
  navigateToImageIndex: (imageIndex) => {
    set({ imageIndex })

    const url = new URL(window.location.href)
    url.searchParams.set(MangaIdSearchParam.PAGE, String(imageIndex + 1))
    window.history.replaceState({}, '', url.toString())
  },
  correctImageIndex: () => set((state) => ({ imageIndex: Math.max(0, state.imageIndex) })),
}))
