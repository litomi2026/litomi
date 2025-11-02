import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKey } from '@/constants/storage'

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  NEON = 'neon',
  RETRO = 'retro',
}

type Store = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<Store>()(
  persist(
    (set) => ({
      theme: Theme.DARK,
      setTheme: (theme: Theme) => set({ theme }),
    }),
    { name: LocalStorageKey.THEME },
  ),
)
