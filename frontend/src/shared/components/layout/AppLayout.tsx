import { Outlet } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { CommandPalette } from "@/shared/components/command/CommandPalette"
import { Footer } from "./Footer"
import { Header } from "./Header"

// Port of the shadcn-dashboard template dashboard layout. The window scrolls
// (as in the template); `overflow-clip` instead of `overflow-hidden` keeps the
// inset from becoming a scroll container, so the sticky header actually sticks.
export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="m-2 min-w-0 overflow-clip rounded-none! outline outline-border">
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-[1367px]">
            <div className="min-h-[calc(100vh-140px)]">
              <Outlet />
            </div>
            <div className="pt-6">
              <Footer />
            </div>
          </div>
        </div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  )
}
