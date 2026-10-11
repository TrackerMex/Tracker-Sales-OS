import { useEffect, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAppStore } from "@/shared/store/app.store"
import { NAV_SECTIONS } from "@/shared/navigation/nav-items"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandPalette() {
  const openerRef = useRef<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { currentUser } = useAppStore()
  const role = currentUser?.role

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (!open) {
          openerRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null
        }
        setOpen(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open])

  useEffect(() => {
    const openPalette = () => {
      if (!open) {
        openerRef.current = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      }
      setOpen(true)
    }
    window.addEventListener("open-command-palette", openPalette)
    return () => window.removeEventListener("open-command-palette", openPalette)
  }, [open])

  const run = (to: string) => {
    setOpen(false)
    void navigate({ to })
  }

  // filtrar NAV_SECTIONS por rol — misma lógica que app-sidebar.tsx
  const sections = NAV_SECTIONS.map((section) => ({
    header: section.header,
    items: role
      ? section.items.filter((item) => item.roles.includes(role))
      : section.items,
  })).filter((s) => s.items.length > 0)

  return (
    // Same markup as CommandDialog (components/ui/command.tsx), which does not
    // forward className to DialogContent; sm:max-w-md keeps the 448px width.
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          const opener = openerRef.current
          const target = opener?.isConnected && opener !== document.body
            ? opener
            : document.querySelector<HTMLButtonElement>('header [data-slot="sidebar-trigger"]')
          target?.focus()
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Paleta de comandos</DialogTitle>
          <DialogDescription>Busca un comando o navega...</DialogDescription>
        </DialogHeader>
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
          <CommandInput placeholder="Buscar módulo o acción..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup heading="Acciones">
              <CommandItem onSelect={() => run("/actividades/nueva")}>
                Registrar actividad
              </CommandItem>
              <CommandItem onSelect={() => run("/agenda")}>Nueva tarea</CommandItem>
              <CommandItem onSelect={() => run("/clientes")}>
                Nuevo prospecto
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            {sections.map((section) => (
              <CommandGroup key={section.header} heading={section.header}>
                {section.items.map((item) => (
                  <CommandItem key={item.to} onSelect={() => run(item.to)}>
                    {item.icon}
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
