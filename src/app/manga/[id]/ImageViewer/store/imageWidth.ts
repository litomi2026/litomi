import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKey } from '@/constants/storage'

export type ImageWidth = 100 | 30 | 50 | 70

type Store = {
  imageWidth: ImageWidth
  setImageWidth: (imageWidth: ImageWidth) => void
  cycleImageWidth: () => void
}

const widthCycle: ImageWidth[] = [30, 50, 70, 100]

export const useImageWidthStore = create<Store>()(
  persist(
    (set, get) => ({
      imageWidth: 100,
      setImageWidth: (imageWidth: ImageWidth) => set({ imageWidth }),
      cycleImageWidth: () => {
        const currentIndex = widthCycle.indexOf(get().imageWidth)
        const nextIndex = (currentIndex + 1) % widthCycle.length
        set({ imageWidth: widthCycle[nextIndex] })
      },
    }),
    { name: LocalStorageKey.CONTROLLER_IMAGE_WIDTH },
  ),
)
