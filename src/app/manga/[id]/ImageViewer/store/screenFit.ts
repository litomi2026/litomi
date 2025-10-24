import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKey } from '@/constants/storage'

export type ScreenFit = 'all' | 'height' | 'width'

type Store = {
  screenFit: ScreenFit
  setScreenFit: (screenFit: ScreenFit) => void
}

export const useScreenFitStore = create<Store>()(
  persist(
    (set) => ({
      screenFit: 'all',
      setScreenFit: (screenFit: ScreenFit) => set({ screenFit }),
    }),
    { name: LocalStorageKey.CONTROLLER_SCREEN_FIT },
  ),
)
