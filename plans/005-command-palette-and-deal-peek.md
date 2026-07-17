# Plan 005: Componentes base para paleta de comandos y peek de deal

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada comando
> de verificación y confirma el resultado esperado antes de avanzar. Si ocurre
> algo de la sección "STOP conditions", detente y reporta — no improvises.
> Al terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat cc0b102..HEAD -- frontend/src/components/ui/command.tsx frontend/src/components/app-sidebar.tsx frontend/src/shared/components/layout frontend/src/modules/pipeline/presentation/components/DealCard.tsx`
> Cambios de los planes 001–003 en Header/DealCard son esperados. Si
> `command.tsx` o `app-sidebar.tsx` difieren de los extractos, condición de STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-tracker-tokens-tailwind.md; plans/003-inline-styles-core-modules.md (recomendado — DealCard limpio)
- **Category**: direction
- **Planned at**: commit `cc0b102`, 2026-07-14

## Why this matters

La crítica de UI identifica dos carencias de eficiencia (P2): no hay paleta de
comandos/búsqueda global (las acciones rápidas son 3 botones fijos en el header
que no escalan) y toda inspección de un deal obliga a abrir el expediente
completo en un Sheet. Este plan construye las piezas: una `CommandPalette`
global con Ctrl+K montada en el layout, y un patrón de "peek" contextual
aplicado al deal (popover con 5 datos y 2 acciones). Ambos quedan listos para
que features futuras agreguen comandos y peeks de tarea/cliente.

## Current state

- `frontend/src/components/ui/command.tsx` — primitivos cmdk existentes.
  Exporta SOLO: `Command, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem` (línea 112). Faltan `CommandDialog`,
  `CommandSeparator`, `CommandShortcut`. El archivo usa el idioma shadcn v4:
  funciones planas (sin forwardRef), atributo `data-slot`, helper `cn` de
  `@/lib/utils`, iconos Hugeicons (`Search01Icon`).
- `frontend/src/components/ui/popover.tsx` — completo: exporta `Popover,
  PopoverTrigger, PopoverContent, PopoverAnchor`.
- `frontend/src/components/ui/dialog.tsx` — Dialog shadcn disponible.
- `cmdk ^1.1.1` ya está en `frontend/package.json` — no instalar nada.
- `frontend/src/components/app-sidebar.tsx` — define la navegación role-gated:

  ```tsx
  interface NavItemDef {
    to: string
    label: string
    roles: UserRole[]
    icon: React.ReactNode
  }

  const SECTIONS: { header: string; items: NavItemDef[] }[] = [
    { header: 'Principal', items: [ { to: '/dashboard', label: 'Dashboard', roles: ['Admin', 'Director'], icon: (...) }, ... ] },
    ...
  ]
  ```

  Rutas existentes: `/dashboard`, `/mi-dia`, `/clientes`, `/agenda`,
  `/actividades/nueva`, `/pipeline`, `/ventas`, `/coaching`, `/reportes`,
  `/equipo`, `/configuracion`, `/import-export`. `UserRole` viene de
  `@/core/domain/types/common.types` (valores `'Admin' | 'Director' | 'Seller'`).
  Antes de tocar nada, LEE cómo `app-sidebar.tsx` filtra `SECTIONS` por el rol
  del usuario (usa `useAppStore` de `@/shared/store/app.store`) y replica esa
  misma lógica en la paleta.
- `frontend/src/shared/components/layout/AppLayout.tsx` — layout autenticado
  (sidebar + header + outlet). Aquí se monta la paleta.
- `frontend/src/shared/components/layout/Header.tsx` — acciones rápidas
  actuales: `Tarea` → `/agenda`, `Prospecto` → `/clientes`,
  `Registrar actividad` → `/actividades/nueva` (Buttons, ver líneas 54–79).
  Usa `useNavigate` de `@tanstack/react-router`.
- `frontend/src/modules/pipeline/presentation/components/DealCard.tsx` —
  tarjeta de deal del kanban. Props: `{ deal: Deal; onClick: (deal) => void; teamMode?: boolean }`.
  `onClick` abre el expediente completo (`setSelectedDeal` en PipelinePage →
  Sheet con ClientDetailPage). La tarjeta entera es draggable
  (`@atlaskit/pragmatic-drag-and-drop`) y clickeable.
- Tipo `Deal` (`frontend/src/modules/pipeline/domain/pipeline.types.ts:80`):
  `id, clientId, clientName, sellerId, stage, amount, probability,
  stageHistory, opportunityName, contactName?, contactRole?, painPoint?,
  sellerName?, nextStep?, nextDate?, nextTime?, createdAt?, updatedAt?`.
- Formato de moneda: usar `formatCurrency` de `@/shared/lib/format` (ya usado
  por dashboard y pipeline).
- Navegar a registrar actividad con contexto (patrón existente en
  `ClientDetailPage.tsx:330`):
  `navigate({ to: "/actividades/nueva", search: { clientId: deal.clientId, clientName: deal.clientName } })`.
- Convención de estructura (docs/conventions.md): componentes compartidos en
  `frontend/src/shared/components/`; componentes de un módulo en
  `frontend/src/modules/<name>/presentation/components/`.

## Commands you will need

Ejecutar desde `frontend/`:

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0              |
| Lint      | `npm run lint`      | exit 0              |
| Build     | `npm run build`     | exit 0              |
| Dev       | `npm run dev`       | Vite sirve la app   |

## Scope

**In scope** (únicos archivos a modificar o crear):
- `frontend/src/components/ui/command.tsx` (extender exports)
- `frontend/src/shared/navigation/nav-items.tsx` (crear)
- `frontend/src/components/app-sidebar.tsx` (importar nav-items en vez de SECTIONS local)
- `frontend/src/shared/components/command/CommandPalette.tsx` (crear)
- `frontend/src/shared/components/layout/AppLayout.tsx` (montar paleta)
- `frontend/src/shared/components/layout/Header.tsx` (agregar trigger de búsqueda)
- `frontend/src/shared/components/peek/Peek.tsx` (crear)
- `frontend/src/modules/pipeline/presentation/components/DealPeek.tsx` (crear)
- `frontend/src/modules/pipeline/presentation/components/DealCard.tsx` (integrar peek)

**Out of scope** (NO tocar):
- NO eliminar los 3 botones de acciones rápidas del Header — su reemplazo por
  la barra de búsqueda es una decisión de rediseño posterior.
- NO implementar búsqueda de datos (clientes/deals) dentro de la paleta — solo
  navegación y acciones estáticas; la búsqueda con API es feature futura.
- NO crear peeks de tarea ni cliente — solo los primitivos y el de deal.
- PipelinePage, ClientDetailPage, rutas, backend.

## Git workflow

- Branch: `advisor/005-command-palette-and-deal-peek`
- Un commit por step; ej. `feat(ui): add CommandDialog primitives`,
  `feat(shared): add global command palette`, `feat(pipeline): add deal peek popover`
- NO hacer push ni abrir PR.

## Steps

### Step 1: Completar primitivos en `command.tsx`

Agregar al final de `frontend/src/components/ui/command.tsx` (antes del bloque
`export`), siguiendo el idioma del archivo (data-slot + cn, sin forwardRef):

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

function CommandDialog({
  title = "Paleta de comandos",
  description = "Busca un comando o navega...",
  children,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)}
      {...props}
    />
  )
}
```

Ajusta la posición del `DialogHeader` si `dialog.tsx` exige que viva dentro de
`DialogContent` (léelo); en ese caso ponlo como primer hijo de `DialogContent`.
Agrega los tres al bloque `export`.

**Verify**: `npm run typecheck` exit 0.

### Step 2: Extraer la navegación a `shared/navigation/nav-items.tsx`

Crear `frontend/src/shared/navigation/nav-items.tsx`: mueve TAL CUAL la
interface `NavItemDef` y el array `SECTIONS` desde `app-sidebar.tsx`
(renómbralo `NAV_SECTIONS` y exporta ambos). En `app-sidebar.tsx` elimina la
copia local e importa `{ NAV_SECTIONS, type NavItemDef } from '@/shared/navigation/nav-items'`
(mantén el resto del archivo idéntico, solo renombra referencias de `SECTIONS`
a `NAV_SECTIONS`).

**Verify**: `npm run typecheck && npm run build` exit 0; el sidebar se ve igual en `npm run dev`.

### Step 3: Crear `CommandPalette`

Crear `frontend/src/shared/components/command/CommandPalette.tsx`. Forma
objetivo (adapta el filtrado por rol a la lógica EXACTA que usa app-sidebar):

```tsx
import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAppStore } from "@/shared/store/app.store"
import { NAV_SECTIONS } from "@/shared/navigation/nav-items"
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator, CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { currentUser } = useAppStore()

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

  // filtrar NAV_SECTIONS por rol — replicar la lógica de app-sidebar.tsx
  ...

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar módulo o acción..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        <CommandGroup heading="Acciones">
          <CommandItem onSelect={() => run("/actividades/nueva")}>Registrar actividad</CommandItem>
          <CommandItem onSelect={() => run("/agenda")}>Nueva tarea</CommandItem>
          <CommandItem onSelect={() => run("/clientes")}>Nuevo prospecto</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        {/* un CommandGroup por sección de NAV_SECTIONS filtrada, con item.icon + item.label */}
      </CommandList>
    </CommandDialog>
  )
}
```

**Verify**: `npm run typecheck` exit 0.

### Step 4: Montar en AppLayout y trigger en Header

- En `AppLayout.tsx`: renderiza `<CommandPalette />` una sola vez, hermano del
  contenido principal (los layouts con sidebar suelen tenerlo al final del
  wrapper).
- En `Header.tsx`, dentro del grupo `hidden md:flex`, ANTES del botón "Tarea",
  agrega el trigger visible del atajo:

  ```tsx
  <Button
    variant="ghost"
    onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
    aria-label="Abrir paleta de comandos"
  >
    Buscar
    <kbd className="rounded border border-tracker-border bg-tracker-surface-alt px-1 text-[10px] text-tracker-text-muted">Ctrl K</kbd>
  </Button>
  ```

  Alternativa más limpia si lo prefieres: exportar un pequeño store/estado
  compartido para abrir la paleta en vez de despachar el KeyboardEvent — pero
  NO introduzcas un store global nuevo; un evento custom
  (`window.dispatchEvent(new CustomEvent('open-command-palette'))` escuchado en
  CommandPalette) también es aceptable. Elige UNA de las dos variantes.

**Verify**: en `npm run dev`, (a) Ctrl+K abre/cierra la paleta en cualquier
página autenticada, (b) el botón "Buscar" del header la abre, (c) seleccionar
"Pipeline" navega a /pipeline y la cierra, (d) con un usuario Seller NO aparece
"Dashboard" (role-gated), (e) Escape la cierra.

### Step 5: Primitivos de peek

Crear `frontend/src/shared/components/peek/Peek.tsx` — piezas de layout para
popovers de previsualización (sin lógica, solo presentación):

```tsx
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PeekHeader({ title, badge }: { title: string; badge?: ReactNode }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-2">
      <p className="truncate text-[13px] font-bold text-tracker-blue">{title}</p>
      {badge}
    </div>
  )
}

export function PeekRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-0.5", className)}>
      <span className="shrink-0 text-[11px] text-tracker-text-muted">{label}</span>
      <span className="truncate text-right text-xs font-medium text-tracker-text">{value}</span>
    </div>
  )
}

export function PeekActions({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex gap-2 border-t border-tracker-border pt-2.5">{children}</div>
}
```

**Verify**: `npm run typecheck` exit 0.

### Step 6: `DealPeek` + integración en DealCard

Crear `frontend/src/modules/pipeline/presentation/components/DealPeek.tsx`:
componente de contenido (se renderiza dentro de un `PopoverContent`):

```tsx
import { useNavigate } from "@tanstack/react-router"
import type { Deal } from "../../domain/pipeline.types"
import { formatCurrency } from "@/shared/lib/format"
import { Button } from "@/components/ui/button"
import { PeekHeader, PeekRow, PeekActions } from "@/shared/components/peek/Peek"

export function DealPeek({ deal, onOpenDetail }: { deal: Deal; onOpenDetail: (deal: Deal) => void }) {
  const navigate = useNavigate()
  return (
    <div className="w-64">
      <PeekHeader title={deal.clientName} badge={/* badge de etapa: mismo span con background dinámico que usa DealCard */} />
      <PeekRow label="Monto" value={formatCurrency(deal.amount)} />
      <PeekRow label="Probabilidad" value={`${deal.probability}%`} />
      {deal.sellerName && <PeekRow label="Vendedor" value={deal.sellerName} />}
      {deal.nextStep && <PeekRow label="Próximo paso" value={deal.nextStep} />}
      {deal.updatedAt && <PeekRow label="Última actividad" value={new Date(deal.updatedAt).toLocaleDateString("es-MX")} />}
      <PeekActions>
        <Button size="xs" variant="secondary" className="flex-1" onClick={() => onOpenDetail(deal)}>
          Abrir expediente
        </Button>
        <Button size="xs" variant="success" className="flex-1"
          onClick={() => void navigate({ to: "/actividades/nueva", search: { clientId: deal.clientId, clientName: deal.clientName } })}>
          Registrar avance
        </Button>
      </PeekActions>
    </div>
  )
}
```

Integración en `DealCard.tsx`: en la fila superior de la tarjeta (junto al
badge de etapa) agrega un trigger discreto que NO dispare el `onClick` de la
tarjeta ni el drag:

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="ghost" size="icon-xs" aria-label="Vista rápida"
      className="bg-transparent text-tracker-text-muted hover:bg-slate-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* icono ojo/info de @hugeicons/core-free-icons, p. ej. ViewIcon */}
    </Button>
  </PopoverTrigger>
  <PopoverContent align="start" onClick={(e) => e.stopPropagation()}>
    <DealPeek deal={deal} onOpenDetail={onClick} />
  </PopoverContent>
</Popover>
```

Busca un icono existente en `@hugeicons/core-free-icons` (el proyecto ya usa
`HugeiconsIcon` — mira `command.tsx:5-6` como patrón de import/uso).

**Verify**: en `npm run dev`, en /pipeline: (a) el icono de vista rápida abre
el popover con los datos del deal, (b) click en el icono NO abre el Sheet del
expediente, (c) "Abrir expediente" sí lo abre, (d) "Registrar avance" navega a
/actividades/nueva con el cliente precargado, (e) el drag de la tarjeta sigue
funcionando arrastrando desde el cuerpo de la tarjeta.

### Step 7: Verificación global

```
npm run typecheck && npm run lint && npm run build
```

**Verify**: exit 0 × 3.

## Test plan

Sin tests de frontend. Gates: typecheck + lint + build, más las verificaciones
manuales de los Steps 4 y 6 (son el criterio funcional real). Ejecuta la
checklist manual completa con un usuario Admin y repite (a)–(e) del Step 4 con
un Seller.

## Done criteria

- [ ] `rg -n 'CommandDialog|CommandSeparator|CommandShortcut' frontend/src/components/ui/command.tsx` → los tres exportados
- [ ] `rg -c 'NAV_SECTIONS' frontend/src` → aparece en `nav-items.tsx`, `app-sidebar.tsx` y `CommandPalette.tsx`
- [ ] Existen `CommandPalette.tsx`, `Peek.tsx`, `DealPeek.tsx` en las rutas indicadas
- [ ] Checklist manual de Steps 4 y 6 completa (documenta el resultado en la nota de estado del README)
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` → exit 0
- [ ] `git status` sin archivos fuera del in-scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

Detente y reporta si:

- `command.tsx` o `app-sidebar.tsx` no coinciden con los extractos (drift).
- La API de `cmdk` 1.1.1 no expone `CommandPrimitive.Separator` — no cambies
  de versión; reporta.
- `useAppStore` no expone el rol del usuario de forma directa y app-sidebar lo
  obtiene por otra vía que no puedas replicar limpiamente — reporta cómo lo
  hace antes de inventar un mecanismo.
- El Popover dentro de la tarjeta draggable no puede abrirse (el drag captura
  el pointer) tras dos intentos de ajuste — reporta; NO muevas el trigger fuera
  de la tarjeta por tu cuenta.
- La ruta `/actividades/nueva` no acepta los search params `clientId/clientName`
  (verifícalo en ClientDetailPage.tsx:330 — si ese patrón cambió, STOP).

## Maintenance notes

- La paleta es el punto de extensión para: búsqueda de clientes/deals con API,
  atajos adicionales y las "vistas inteligentes" (P1 de la crítica). Agregar
  comandos = agregar `CommandItem`s; no requiere tocar el mecanismo.
- El patrón Peek está listo para tarea y cliente: crear `TaskPeek`/`ClientPeek`
  en sus módulos reutilizando `Peek.tsx` (misma estructura que `DealPeek`).
- Cuando la paleta demuestre adopción, evaluar reemplazar los 3 botones fijos
  del Header por la barra de búsqueda (recomendación P2 de la crítica) —
  decisión de producto, no técnica.
- Un reviewer debe verificar el `stopPropagation` del trigger del peek: sin él,
  cada apertura de peek abriría también el expediente.
