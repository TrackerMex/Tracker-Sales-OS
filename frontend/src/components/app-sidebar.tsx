import * as React from "react"
import { useAppStore } from "@/shared/store/app.store"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NAV_SECTIONS } from "@/shared/navigation/nav-items"
import { PulseIcon } from "@/shared/components/Icon"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useAppStore((s) => s.currentUser)
  const role = currentUser?.role

  const sections = NAV_SECTIONS.map((section) => ({
    header: section.header,
    items: (role
      ? section.items.filter((item) => item.roles.includes(role))
      : section.items
    ).map(({ to, label, icon }) => ({ to, label, icon })),
  })).filter((s) => s.items.length > 0)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex cursor-default items-center gap-2 select-none">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-tracker-green/15">
                  <PulseIcon className="text-tracker-green" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[13px] font-black tracking-wider text-tracker-green">
                    TRACKER
                  </span>
                  <span className="truncate text-[9px] font-semibold tracking-[0.12em] text-white/40">
                    SALES OS
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={sections} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
