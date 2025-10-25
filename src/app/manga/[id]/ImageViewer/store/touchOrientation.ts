import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKey } from '@/constants/storage'

type TouchOrientation = 'horizontal-reverse' | 'horizontal' | 'vertical-reverse' | 'vertical'
export const orientations: TouchOrientation[] = ['horizontal', 'vertical', 'horizontal-reverse', 'vertical-reverse']

type Store = {
  touchOrientation: TouchOrientation
  getTouchOrientation: () => TouchOrientation
  setTouchOrientation: (orientation: TouchOrientation) => void
}

export const useTouchOrientationStore = create<Store>()(
  persist(
    (set, get) => ({
      touchOrientation: 'horizontal',
      getTouchOrientation: () => get().touchOrientation,
      setTouchOrientation: (orientation: TouchOrientation) => set({ touchOrientation: orientation }),
    }),
    { name: LocalStorageKey.CONTROLLER_TOUCH_ORIENTATION },
  ),
)
