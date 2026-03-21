import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { SessionStorageKey } from '@/constants/storage'

export type LowDataPreference = 'auto' | 'off' | 'on'

type Store = {
  preference: LowDataPreference
  cyclePreference: () => void
}

const DEFAULT_PREFERENCE: LowDataPreference = 'auto'
const PREFERENCE_CYCLE: readonly LowDataPreference[] = ['off', 'auto', 'on']

export const useLowDataModeStore = create<Store>()(
  persist(
    (set, get) => ({
      preference: DEFAULT_PREFERENCE,
      cyclePreference: () => {
        const currentIndex = PREFERENCE_CYCLE.indexOf(get().preference)
        const nextIndex = (currentIndex + 1) % PREFERENCE_CYCLE.length
        set({ preference: PREFERENCE_CYCLE[nextIndex] ?? DEFAULT_PREFERENCE })
      },
    }),
    {
      name: SessionStorageKey.CONTROLLER_LOW_DATA_MODE,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

export function useLowDataPreferenceHydrated() {
  const [isLowDataPreferenceHydrated, setIsLowDataPreferenceHydrated] = useState(() =>
    useLowDataModeStore.persist.hasHydrated(),
  )

  // NOTE: sessionStorage 기반 선호 설정이 복원된 뒤에 정책을 계산해야 첫 렌더가 일관돼요
  useEffect(() => {
    const unsubscribeHydrate = useLowDataModeStore.persist.onHydrate(() => setIsLowDataPreferenceHydrated(false))
    const unsubscribeFinishHydration = useLowDataModeStore.persist.onFinishHydration(() =>
      setIsLowDataPreferenceHydrated(true),
    )

    setIsLowDataPreferenceHydrated(useLowDataModeStore.persist.hasHydrated())

    return () => {
      unsubscribeHydrate()
      unsubscribeFinishHydration()
    }
  }, [])

  return isLowDataPreferenceHydrated
}
