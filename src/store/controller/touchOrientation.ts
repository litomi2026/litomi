import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LocalStorageKeys } from '..'

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
    { name: LocalStorageKeys.CONTROLLER_TOUCH_ORIENTATION },
  ),
)
