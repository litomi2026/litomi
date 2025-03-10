import { LocalStorageKey } from '@/constants/localStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TouchOrientation = 'horizontal' | 'vertical'

type Store = {
  touchOrientation: TouchOrientation
  setTouchOrientation: (orientation: TouchOrientation) => void
}

export const useTouchOrientationStore = create<Store>()(
  persist(
    (set) => ({
      touchOrientation: 'horizontal',
      setTouchOrientation: (orientation: TouchOrientation) => set({ touchOrientation: orientation }),
    }),
    { name: LocalStorageKey.CONTROLLER_TOUCH_ORIENTATION },
  ),
)
