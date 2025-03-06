import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKeys } from '..'

export type NavigationMode = 'scroll' | 'touch'

type Store = {
  navMode: NavigationMode
  setNavMode: (mode: NavigationMode) => void
}

export const useNavigationModeStore = create<Store>()(
  persist(
    (set) => ({
      navMode: 'touch',
      setNavMode: (navMode: NavigationMode) => set({ navMode }),
    }),
    { name: LocalStorageKeys.CONTROLLER_NAVIGATION_MODE },
  ),
)
