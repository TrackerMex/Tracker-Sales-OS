import type { AuthUser } from "@/core/domain/types/common.types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AppState {
  currentUser: AuthUser | null
  accessToken: string | null
  sidebarOpen: boolean
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      sidebarOpen: true,
      setAuth: (user, token) => {
        localStorage.setItem("accessToken", token)
        set({ currentUser: user, accessToken: token })
      },
      clearAuth: () => {
        localStorage.removeItem("accessToken")
        set({ currentUser: null, accessToken: null })
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
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
