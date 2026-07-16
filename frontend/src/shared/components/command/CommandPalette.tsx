import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAppStore } from "@/shared/store/app.store"
import { NAV_SECTIONS } from "@/shared/navigation/nav-items"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { currentUser } = useAppStore()
  const role = currentUser?.role

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

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
    <CommandDialog open={open} onOpenChange={setOpen}>
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
    </CommandDialog>
  )
}
