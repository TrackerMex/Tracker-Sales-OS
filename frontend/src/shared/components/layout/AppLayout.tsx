import { Outlet } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CommandPalette } from "@/shared/components/command/CommandPalette"
import { Header } from "./Header"

export function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-hidden">
          <Header />
          <div className="flex-1 overflow-x-hidden overflow-y-auto bg-tracker-bg p-5">
            <Outlet />
          </div>
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </TooltipProvider>
  )
}
