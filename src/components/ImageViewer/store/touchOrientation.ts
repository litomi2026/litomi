import { LocalStorageKey } from '@/constants/storage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TouchOrientation = 'horizontal' | 'vertical'

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
