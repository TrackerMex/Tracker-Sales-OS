# impl_44-task-delete-icons

## Archivo modificado
- `frontend/src/modules/tasks/presentation/components/TaskCard.tsx`

## Iconos agregados (HugeiconsIcon, patrón replicado de MiDiaPage.tsx / ActivitiesPage.tsx)
- Client name (row 2): `OfficeIcon` size=12 color=#334155
- Contact name (row 4): `User02Icon` size=11 color=#94A3B8 (mantiene color existente del span, no el de MiDiaPage)
- Badge de tipo (row 1): `CheckListIcon` size=11 color=currentColor
- Botón Editar: `PencilEdit02Icon` size=13 color=currentColor (reemplaza el `<svg>` inline hardcodeado)
- Botón Completar: `CheckmarkCircle02Icon` size=13 color=currentColor (icono + texto, gap 5px)
- Botón Reactivar: `ArrowReloadHorizontalIcon` size=13 color=currentColor (icono + texto, gap 5px)
- Botón Eliminar: `Delete02Icon` size=13 color=currentColor (icono + texto, gap 5px)

Los 7 iconos verificados previamente contra `node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts` (14 ocurrencias totales, uno de definición + uno de reexport por cada uno de los 7 nombres).

## Cambios de layout
- Contenedores de client name (`<p>`) y badge de tipo (`<span>`) pasan a flex/inline-flex con `gap: 4px` para acomodar icono + texto, sin cambiar el layout general (flex/gap del contenedor padre intacto).
- Botones Completar/Reactivar/Eliminar pasan a `display: inline-flex, alignItems: center, gap: 5px` — siguen siendo icono + texto (no icon-only).
- Botón Editar se mantiene icon-only, solo se reemplazó el SVG crudo por HugeiconsIcon.
- No se tocó ningún AlertDialog, prop, comportamiento, ni `mi-dia/**` / `activities/**`.
- No se agregó icono a formatDate ni al comentario IA (fuera de alcance).

## Resultado de tsc
`cd frontend && npx tsc --noEmit` → 0 errores (solo warnings de npm sobre config `node-linker`/`shamefully-hoist`, no relacionados al código).
