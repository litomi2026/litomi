import { create } from 'zustand'

export type AuthStore = {
  accessToken: string | null
  getAccessToken: () => string | null
  setAccessToken: (accessToken: string | null) => void
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  accessToken: null,
  getAccessToken: () => get().accessToken,
  setAccessToken: (accessToken) => set(() => ({ accessToken })),
}))
