import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKey } from '@/constants/storage'

export type Theme = 'dark' | 'light' | 'neon' | 'retro' | 'system'

type Store = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<Store>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme: Theme) => set({ theme }),
    }),
    { name: LocalStorageKey.THEME },
  ),
)

