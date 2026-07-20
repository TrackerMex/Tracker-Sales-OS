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
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NAV_SECTIONS } from "@/shared/navigation/nav-items"

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
            <div className="flex h-12 w-full cursor-default items-center px-1 py-1 select-none group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!">
              <div className="flex h-10 w-full items-center justify-start pl-2 group-data-[collapsible=icon]:hidden">
                <img
                  src="/brand/trackermexico.png"
                  alt="Tracker México GPS"
                  width={1681}
                  height={280}
                  className="h-auto max-h-7 w-full object-contain object-left"
                />
              </div>
              <div className="hidden size-8 items-center justify-center group-data-[collapsible=icon]:flex">
                <img
                  src="/brand/tracker.png"
                  alt="Tracker"
                  width={162}
                  height={94}
                  className="h-[22px] w-[30px] object-contain"
                />
              </div>
            </div>
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
