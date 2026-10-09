import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserSheet } from "@/components/nav-user"
import { SearchIcon } from "@/shared/components/Icon"
import { ThemeToggle } from "./ThemeToggle"

const openCommandPalette = () =>
  window.dispatchEvent(new CustomEvent("open-command-palette"))

// Port of the shadcn-dashboard template header (vertical layout).
// Below 1025px (sidebar breakpoint) the logo shows here instead of the sidebar.
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background">
      <div className="mx-auto flex flex-wrap items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <img
            src="/brand/tracker.png"
            alt="Tracker México GPS"
            width={162}
            height={94}
            className="h-[23px] w-10 object-contain min-[1025px]:hidden"
          />
          <SidebarTrigger className="size-9 rounded-full hover:bg-primary/5 [&_svg:not([class*='size-'])]:size-5" />
          <Separator
            orientation="vertical"
            className="mr-4 ml-2 data-vertical:h-4 data-vertical:self-center max-[1024px]:hidden"
          />
          <button
            type="button"
            onClick={openCommandPalette}
            aria-keyshortcuts="Control+K"
            className="relative hidden h-8 w-80 items-center rounded-lg border border-input bg-transparent pr-1.5 pl-10 text-left text-xs text-muted-foreground transition-colors outline-none hover:bg-primary/5 focus-visible:border-primary sm:flex dark:bg-input/30"
          >
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <span className="flex-1">Buscar…</span>
            <kbd className="rounded-sm border border-border bg-muted px-1.5 font-sans text-xs">
              Ctrl K
            </kbd>
          </button>
        </div>
        <div className="flex items-center gap-0 sm:gap-1">
          <ThemeToggle />
          <UserSheet />
        </div>
      </div>
    </header>
  )
}
