import * as React from "react"
import { useAppStore } from "@/shared/store/app.store"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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
    <Sidebar
      variant="inset"
      collapsible="icon"
      {...props}
      // z-20: the hover-expanded rail overlays the sticky header (z-10).
      className="sidebar-box z-20 group-data-[state=collapsed]:hover:shadow-xl **:data-[slot=sidebar-inner]:border **:data-[slot=sidebar-inner]:border-border **:data-[slot=sidebar-inner]:bg-background"
    >
      <SidebarHeader className="flex h-[57px] flex-row items-center border-b border-border p-3 group-data-[state=collapsed]:px-2.5">
        <div className="flex h-8 items-center group-data-[collapsible=icon]:hidden">
          <img
            src="/brand/trackermexico-dark.png"
            alt="Tracker México GPS"
            width={1681}
            height={280}
            className="h-7 w-auto dark:hidden"
          />
          <img
            src="/brand/trackermexico.png"
            alt="Tracker México GPS"
            width={1681}
            height={280}
            className="hidden h-7 w-auto dark:block"
          />
        </div>
        <div className="hidden h-8 w-8 items-center justify-center group-data-[collapsible=icon]:flex">
          <img
            src="/brand/tracker.png"
            alt="Tracker México GPS"
            width={162}
            height={94}
            className="h-[19px] w-8 object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={sections} />
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="hide-menu -mx-4 flex flex-col gap-2 border-t border-border px-4 pt-4">
          <NavUser />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
