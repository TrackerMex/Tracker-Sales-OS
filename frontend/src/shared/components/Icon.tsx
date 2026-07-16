import * as React from "react"
import {
  Add,
  ArrowRight,
  Calendar3,
  Check,
  Checklist,
  ChevronDown,
  ChevronExpandY,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit2,
  EyeOpen,
  Folder4,
  Logout,
  MoreH,
  Office,
  Repeat3,
  SearchNormal,
  SidebarLeft,
  TickCircle,
  Trash,
  User4,
  Xmark,
} from "reicon-react"
import type {
  IconComponent,
  IconProps as ReiconIconProps,
} from "reicon-react"

/**
 * Único punto de acoplamiento con `reicon-react`.
 *
 * Ningún otro archivo debe importar de `reicon-react`: cambiar de librería de
 * iconos, o cambiar el glifo de un icono, debe ser una edición de este archivo.
 *
 * El wrapper resuelve tres problemas de la librería que fallan en silencio:
 *
 * 1. `color` inline. `createIcon.js:45` escribe siempre `style={{ color }}` con
 *    default `currentColor`. Un `style` inline gana a las clases Tailwind, así
 *    que `text-muted-foreground` sobre un icono no se aplicaría. Aquí `color`
 *    llega como `undefined` salvo que se pida explícitamente, lo que elimina el
 *    atributo `style` entero y devuelve el control a las clases.
 * 2. `strokeWidth` no es uniforme (ver `strokeWidth` por icono, abajo).
 * 3. Nombres engañosos de reicon (`MoreH` vs `MoreHCircle`, `Check3` que no es
 *    un check, `ListCheck` que no tiene ticks) quedan encapsulados aquí.
 */

/** Props de un icono. `strokeWidth` no se expone: lo fija el wrapper por icono. */
export type IconProps = Omit<ReiconIconProps, "strokeWidth">

/**
 * `strokeWidth` se decide POR ICONO, nunca global, porque reicon mezcla tres
 * geometrías y un valor único daría grosores distintos:
 *
 * - Escalados (`transform="scale(1.33333)"`): su `stroke-width` base de 1.5 ya
 *   se renderiza como 2.0 efectivo. Pasar 2 daría 2.67. → `undefined`
 * - Stroke sin escalar: `stroke-width` base 1.5 → hay que pasar 2. → `2`
 * - Fill (sin `stroke`): `strokeWidth` es un no-op, el grosor está horneado en
 *   el path (~1.5) y no se puede cambiar. → `undefined`
 */
function createIcon(
  Base: IconComponent,
  displayName: string,
  strokeWidth?: 2
) {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ color, style, ...props }, ref) => (
      <Base
        ref={ref}
        strokeWidth={strokeWidth}
        {...props}
        style={{ color, ...style }}
      />
    )
  )
  Icon.displayName = displayName
  return Icon
}

/* -------------------------------------------------------------------------- */
/* Escalados ×1.33 — sin strokeWidth (su default ya da 2.0 efectivo)          */
/* -------------------------------------------------------------------------- */

export const ChevronDownIcon = createIcon(ChevronDown, "ChevronDownIcon")
export const ChevronUpIcon = createIcon(ChevronUp, "ChevronUpIcon")
export const ChevronLeftIcon = createIcon(ChevronLeft, "ChevronLeftIcon")
export const ChevronRightIcon = createIcon(ChevronRight, "ChevronRightIcon")
/** Doble chevron (arriba + abajo) de los triggers de select/combobox. */
export const UnfoldMoreIcon = createIcon(ChevronExpandY, "UnfoldMoreIcon")
export const CloseIcon = createIcon(Xmark, "CloseIcon")
/** Edificio / empresa. Ojo: reicon dibuja dos edificios, no uno. */
export const BuildingIcon = createIcon(Office, "BuildingIcon")
export const EyeIcon = createIcon(EyeOpen, "EyeIcon")

/* -------------------------------------------------------------------------- */
/* Stroke sin escalar — strokeWidth={2} para igualar el 2.0 efectivo          */
/* -------------------------------------------------------------------------- */

/** Toggle del sidebar. Ojo: reicon dibuja un chevron dentro, no dos guiones. */
export const SidebarToggleIcon = createIcon(SidebarLeft, "SidebarToggleIcon", 2)
export const EditIcon = createIcon(Edit2, "EditIcon", 2)
export const CheckCircleIcon = createIcon(TickCircle, "CheckCircleIcon", 2)
export const ReloadIcon = createIcon(Repeat3, "ReloadIcon", 2)
export const PlusIcon = createIcon(Add, "PlusIcon", 2)
export const SearchIcon = createIcon(SearchNormal, "SearchIcon", 2)
export const CalendarIcon = createIcon(Calendar3, "CalendarIcon", 2)
export const FolderIcon = createIcon(Folder4, "FolderIcon", 2)
export const UserIcon = createIcon(User4, "UserIcon", 2)

/* -------------------------------------------------------------------------- */
/* Fill — strokeWidth es no-op, grosor fijo ~1.5                              */
/* -------------------------------------------------------------------------- */

/** Tick simple. Es fill: su grosor no se puede ajustar. */
export const CheckIcon = createIcon(Check, "CheckIcon")
export const TrashIcon = createIcon(Trash, "TrashIcon")
export const LogoutIcon = createIcon(Logout, "LogoutIcon")
/** Tres puntos, sin aro. `MoreHCircle` sí lleva aro: no es este icono. */
export const MoreHorizontalIcon = createIcon(MoreH, "MoreHorizontalIcon")
/** Flecha con cola. Distinto de `ChevronRightIcon`. */
export const ArrowRightIcon = createIcon(ArrowRight, "ArrowRightIcon")
/** Lista con ticks. Ojo: reicon la dibuja dentro de una caja envolvente. */
export const ChecklistIcon = createIcon(Checklist, "ChecklistIcon")
