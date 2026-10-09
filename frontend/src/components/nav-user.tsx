import { useNavigate } from "@tanstack/react-router"
import { useAppStore } from "@/shared/store/app.store"
import { useLogout } from "@/modules/auth/application/hooks/useLogout"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CloseIcon, LogoutIcon } from "@/shared/components/Icon"

const ROLE_LABELS: Record<string, string> = {
  Admin: "Administrador",
  Director: "Director",
  Seller: "Vendedor",
}

function useCurrentUserMenu() {
  const currentUser = useAppStore((s) => s.currentUser)
  const navigate = useNavigate()
  const logout = useLogout()

  const displayName = currentUser
    ? (currentUser.name ?? currentUser.username)
    : ""
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const roleLabel = currentUser?.role
    ? (ROLE_LABELS[currentUser.role] ?? currentUser.role)
    : ""

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
    } catch {
      // best-effort: el logout local debe completarse aunque falle la red
    }
    void navigate({ to: "/login" })
  }

  return { currentUser, displayName, initials, roleLabel, handleLogout }
}

/** Sidebar footer: who is signed in, plus sign-out. */
export function NavUser() {
  const { currentUser, displayName, initials, roleLabel, handleLogout } =
    useCurrentUserMenu()
  if (!currentUser) return null

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-sm leading-tight">
        <span className="truncate font-medium">{displayName}</span>
        <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-primary/5"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        onClick={handleLogout}
      >
        <LogoutIcon className="size-4" />
      </Button>
    </div>
  )
}

/** Header avatar that opens the profile sheet (template `Profile`). */
export function UserSheet() {
  const { currentUser, displayName, initials, roleLabel, handleLogout } =
    useCurrentUserMenu()
  if (!currentUser) return null

  return (
    <Sheet>
      <SheetTrigger
        aria-label="Abrir perfil"
        className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-primary/5"
      >
        <Avatar>
          <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
        </Avatar>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-60 border-s-0 data-[side=right]:sm:max-w-80"
      >
        <SheetClose
          aria-label="Cerrar"
          className="absolute end-5 top-5 rounded-full p-2 hover:bg-primary/5"
        >
          <CloseIcon size={20} />
        </SheetClose>
        <div className="flex flex-col items-center gap-4 p-6 pt-16">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center gap-1 text-center">
            <SheetTitle className="text-lg font-semibold">{displayName}</SheetTitle>
            <SheetDescription className="text-sm">{roleLabel}</SheetDescription>
          </div>
        </div>
        <div className="border-t border-dashed border-border p-6">
          <Button variant="secondary" className="w-full" onClick={handleLogout}>
            <LogoutIcon />
            Cerrar sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
