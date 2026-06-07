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
      partialize: (s) => ({ currentUser: s.currentUser }),
    }
  )
)
