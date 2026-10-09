import { useTheme } from "next-themes"
import { Moon } from "reicon-react"
import { Button } from "@/components/ui/button"
import { SunIcon } from "@/shared/components/Icon"

// next-themes reads localStorage synchronously on the client (SPA, no SSR),
// so the template's "render null until mounted" guard is not needed.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-10 rounded-full hover:bg-primary/5"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}
