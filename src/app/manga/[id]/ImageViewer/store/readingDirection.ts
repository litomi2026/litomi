import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKey } from '@/constants/storage'

export type ReadingDirection = 'ltr' | 'rtl'

type Store = {
  readingDirection: ReadingDirection
  toggleReadingDirection: () => void
}

export const useReadingDirectionStore = create<Store>()(
  persist(
    (set, get) => ({
      readingDirection: 'ltr',
      toggleReadingDirection: () => {
        const current = get().readingDirection
        set({ readingDirection: current === 'ltr' ? 'rtl' : 'ltr' })
      },
    }),
    { name: LocalStorageKey.CONTROLLER_READING_DIRECTION },
  ),
)
