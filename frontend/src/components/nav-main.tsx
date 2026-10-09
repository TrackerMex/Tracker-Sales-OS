import type { ReactNode } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { SidebarGroup, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

interface NavSection {
  header: string
  items: NavItem[]
}

// Port of the shadcn-dashboard template NavCollapse/NavItem (flat items only).
// In the collapsed rail the labels carry `hide-menu` (see index.css) and the
// headings turn into "..."; hovering the rail or tabbing into it expands it.
export function NavMain({ sections }: { sections: NavSection[] }) {
  const { pathname } = useLocation()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const closeMobile = isMobile ? () => setOpenMobile(false) : undefined

  return (
    <SidebarGroup className="flex items-center justify-center px-3 py-4 group-data-[state=collapsed]:px-2">
      <nav aria-label="Navegación principal" className="flex w-full flex-col gap-4">
        {sections.map((section) => (
          <div key={section.header} className="flex flex-col">
            <span
              className={cn(
                "mb-2 block text-xs font-semibold text-muted-foreground uppercase transition-all duration-200",
                isCollapsed &&
                  "text-center group-hover:text-start group-has-[:focus-visible]:text-start"
              )}
            >
              {isCollapsed ? (
                <>
                  <span className="group-hover:hidden group-has-[:focus-visible]:hidden">...</span>
                  <span className="hidden group-hover:inline group-has-[:focus-visible]:inline">
                    {section.header}
                  </span>
                </>
              ) : (
                section.header
              )}
            </span>
            <SidebarMenu className="gap-0">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.to || pathname.startsWith(item.to + "/")
                return (
                  <SidebarMenuItem key={item.to}>
                    <Link
                      to={item.to}
                      aria-label={item.label}
                      onClick={closeMobile}
                      className={cn(
                        "relative my-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 group-data-[state=collapsed]:px-2.5",
                        isActive
                          ? "bg-primary font-medium text-primary-foreground"
                          : "hover:bg-primary/5"
                      )}
                    >
                      <span className="relative flex w-full items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0">
                        {item.icon}
                        <span className="hide-menu font-medium">{item.label}</span>
                      </span>
                    </Link>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </div>
        ))}
      </nav>
    </SidebarGroup>
  )
}
