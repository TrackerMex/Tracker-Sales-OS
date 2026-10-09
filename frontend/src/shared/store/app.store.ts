import type { AuthUser } from "@/core/domain/types/common.types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AppState {
  currentUser: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("refreshToken", refreshToken)
        set({ currentUser: user, accessToken, refreshToken })
      },
      clearAuth: () => {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        set({ currentUser: null, accessToken: null, refreshToken: null })
      },
    }),
    {
      name: "tracker-sales-app",
      storage: {
        getItem: (key) => {
          const value = localStorage.getItem(key)
          return value ? JSON.parse(value) : null
        },
        setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key) => localStorage.removeItem(key),
      },
      partialize: (s) => ({ currentUser: s.currentUser }) as AppState,
    }
  )
)
