import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKey } from '@/constants/storage'

type Orientation = 'horizontal-reverse' | 'horizontal' | 'vertical-reverse' | 'vertical'
export const orientations: Orientation[] = ['horizontal', 'vertical', 'horizontal-reverse', 'vertical-reverse']

type Store = {
  orientation: Orientation
  getOrientation: () => Orientation
  setOrientation: (orientation: Orientation) => void
}

export const useOrientationStore = create<Store>()(
  persist(
    (set, get) => ({
      orientation: 'horizontal',
      getOrientation: () => get().orientation,
      setOrientation: (orientation: Orientation) => set({ orientation: orientation }),
    }),
    { name: LocalStorageKey.CONTROLLER_ORIENTATION },
  ),
)
