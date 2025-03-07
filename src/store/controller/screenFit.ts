import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKeys } from '..'

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
    { name: LocalStorageKeys.CONTROLLER_SCREEN_FIT },
  ),
)
