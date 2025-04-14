import { create } from 'zustand'

const DEFAULT_COOLDOWN = 3

type Store = {
  timerId: NodeJS.Timer | null
  cooldown: number
  startTimer: (initialCooldown?: number) => void
}

export const useShffleStore = create<Store>()((set, get) => ({
  timerId: null,
  cooldown: 0,
  startTimer: (initialCooldown) => {
    if (get().timerId) return

    set({ cooldown: initialCooldown ?? DEFAULT_COOLDOWN })

    const timerId = setInterval(() => {
      set((state) => {
        if (state.cooldown > 1) {
          return { cooldown: state.cooldown - 1 }
        } else {
          clearInterval(state.timerId!)
          return { cooldown: 0, timerId: null }
        }
      })
    }, 1000)

    set({ timerId })
  },
}))
