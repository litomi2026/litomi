import { create } from 'zustand'

import { MangaIdSearchParam } from '@/app/manga/[id]/common'

type Store = {
  imageIndex: number
  getImageIndex: () => number
  setImageIndex: (index: number) => void
  navigateToImageIndex: (index: number) => void
  correctImageIndex: () => void
}

let navigationTimer: NodeJS.Timeout | null = null
let lastImageIndex: number | null = null

function updatePageSearchParam(imageIndex: number) {
  const url = new URL(window.location.href)
  url.searchParams.set(MangaIdSearchParam.PAGE, String(imageIndex))
  window.history.replaceState({}, '', url.toString())
}

export const useImageIndexStore = create<Store>()((set, get) => ({
  imageIndex: 0,
  getImageIndex: () => get().imageIndex,
  setImageIndex: (imageIndex) => set({ imageIndex }),
  navigateToImageIndex: (imageIndex) => {
    set({ imageIndex })
    lastImageIndex = imageIndex

    if (navigationTimer) {
      clearTimeout(navigationTimer)
    }

    navigationTimer = setTimeout(() => {
      try {
        if (typeof lastImageIndex === 'number') {
          updatePageSearchParam(lastImageIndex + 1)
        }
      } catch (error) {
        console.warn('navigateToImageIndex:', error)
      }
    }, 200)

    // NOTE: 여기에 아래 로직을 넣어야 하나?
    // getVirtualizer()?.scrollToIndex(imageIndex)
  },
  correctImageIndex: () => set((state) => ({ imageIndex: Math.max(0, state.imageIndex) })),
}))
