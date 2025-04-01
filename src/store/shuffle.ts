import { create } from 'zustand'

type Store = {
  cooldown: number
  setCooldown: (cooldown: number) => void
}

export const useShffleStore = create<Store>()((set) => ({
  cooldown: 3,
  setCooldown: (cooldown) => set({ cooldown }),
}))
