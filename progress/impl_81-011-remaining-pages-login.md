# Impl 81 / plan 011: Coaching, Reportes, Equipo, Configuración, Import/Export y Login

Estado: DONE, sin commit. Los cambios quedan en el working tree, pendientes de review.

Rama `81-visual-redesign`, base `b07c300`. Solo se tocó markup y clases, más el retorno de foco del AlertDialog de Equipo (ver Decisiones). No cambiaron la lógica, las validaciones, los schemas, los hooks, la API ni el flujo de auth.

## Archivos tocados

`git status` muestra modificados solo estos 6 archivos. Los `??` de `progress/` ya existían.

### Coaching

Archivo: `frontend/src/modules/coaching/presentation/pages/CoachingPage.tsx`

- **Cabecera:**
  - `PageHeader` con título "Coaching" y la descripción original.
  - En las acciones van "Mínimo diario N pts" y, para el admin, el Select de vendedor (`aria-label="Filtrar por vendedor"`).
- **Bento** (`grid-cols-12 gap-px bg-border`):
  - Cada vendedor es un `SectionCard` con `col-span-12 xl:col-span-6`.
  - Si el número de tarjetas es impar, la última ocupa las 12 columnas.
  - La cabecera de cada tarjeta muestra el nombre, el perfil (o "Ejecutivo comercial") y un `StatusBadge` con los puntos.
- **Métricas:**
  - Cuatro `StatCard`: Llamadas, Reuniones, Propuestas y Cierres. Van en 2 columnas en móvil y en 4 desde `sm`.
  - Tres más: Calidad (con barra), Vencidos y Mañana. En móvil Calidad ocupa la fila entera y las otras dos comparten fila; desde `sm` van en 3 columnas.
- **Barra:** sustituye a `StatCell` y `ProgressBar`. Mantiene `scaleX` y añade `motion-reduce:transition-none`. Los colores salen de `STATUS_FILL_CLASS`.
- **Caja de IA:** lleva una fila de cabecera con icono y h3: "Coach IA" si hay insights, "Acción recomendada" si no.
- **Estados:**
  - Mientras carga se ve un bento de skeletons con `role=status`.
  - Si no hay vendedores, un `EmptyState`.
- **Eliminado:** `max-w-[1200px] p-6` y todos los `text-[Npx]`.

### Reportes

Archivo: `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`. El popup no se tocó.

- **Cabecera:**
  - `PageHeader` "Reportes" / "Informe ejecutivo mensual".
  - Acciones: el menú `…` con Guardar, Copiar y Compartir (los mismos items y handlers) y el botón "Abrir lámina".
- **"Periodo y metas":** es una sección de formulario dentro del bento, con h2 y descripción. Los 4 campos van con Label e Input. El Accordion se eliminó.
- **"Detalle top vendedores":** es un `SectionCard` con `DataTable`.
  - Columnas: Vendedor, Unidades (solo desde `sm`), Monto (solo desde `sm`) y % Meta (`StatusBadge`).
  - En móvil, debajo del nombre se muestran "N unidades · $monto".
- **"Resumen para Dirección":** es un `SectionCard` envuelto en un `div` que conserva `id="executive-report-text"`, así que el `innerText` que copia el menú sigue funcionando.
- **Estados:** la carga muestra un Skeleton. El error muestra un `EmptyState` con el botón Reintentar.
- **Sin cambios:**
  - `ExecutiveSlide` se renderiza dentro de `mt-4` y no se modificó.
  - El bloque `openLamina` → `win.document.close` es idéntico a HEAD (`diff` vacío).

### Equipo

Archivo: `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx`

- **Cabecera:** `PageHeader` "Equipo" / "Comerciales, accesos y usuarios del sistema".
- **Bento de 3 columnas en `lg`** (`lg:col-span-4`), con un `SectionCard` cada una:
  - "Alta comercial"
  - "Crear usuario"
  - "Usuarios del sistema"
- **Formularios:**
  - Cada Label tiene `htmlFor` y un id único: `seller-name`, `seller-profile`, `user-username`, `user-password`, `user-full-name`, `user-role` y `user-seller`.
  - El footer usa `border-t` y un Button `size="lg"`.
- **Usuarios:**
  - Lista `divide-y` con `max-h-96`.
  - Cada fila muestra "usuario · rol legible", un `StatusBadge` (Activo o Bloqueado) y el menú `…`. El menú sigue deshabilitado para `admin`.
- **"Equipo comercial":**
  - Va debajo de un `DottedDivider` y es un `SectionCard` con `DataTable`.
  - Columnas: Vendedor, Perfil (solo desde `sm`), Estado (Activo o De baja) y acciones.
  - En móvil el perfil va debajo del nombre y puede partirse en varias líneas.
- **Seller:** ve `PageHeader` más un `EmptyState` de "Acceso denegado".
- **Retorno de foco:** al cerrar el AlertDialog, el foco vuelve al botón `…` de la fila (ver Decisiones).
- **Eliminado:** `p-6` y `.slabel`.

### Configuración

Archivo: `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx`

- **Cabecera:** `PageHeader` "Configuración" / "Metas comerciales y umbrales de riesgo".
- **Formulario** con el patrón de la plantilla:
  - Cabecera h2 "Metas del sistema" y, si el usuario no es admin, una nota.
  - `FormErrorSummary`.
  - Tres secciones h3 en `md:grid-cols-3`: Metas diarias, Metas mensuales y Riesgo y cartera.
  - Footer de admin con "Configuración guardada" (`role=status`) y Guardar `size="lg"`.
- **Ids:** inputs `settings-<campo>` y `FieldError` con `name=<campo>`, todos únicos.
- **Eliminado:** el Accordion y `max-w-[560px]`.

### Import/Export

Archivo: `frontend/src/modules/import-export/presentation/pages/ImportExportPage.tsx`

- **Cabecera:** `PageHeader` "Import / Export" / "Respaldo y restauración de los datos del sistema".
- **Bento** con dos `SectionCard`:
  - "Exportar datos" (`lg:col-span-5`).
  - "Importar datos" (`lg:col-span-7`): Label e Input `id="import-file"`, `fieldErrorProps` y `FieldError name="import-file"`.
- **Vista previa:** un `DataTable` (Sección y Contenido) con etiquetas legibles para cada sección (`SECTION_LABELS`), más los botones Cancelar e Importar.
- **Éxito:** una tarjeta `role=status` con `STATUS_TILE_CLASS.success`.
- **No admin:** ve un `EmptyState`.
- **Eliminado:** `.empty-state`.

### Login

Archivo: `frontend/src/modules/auth/presentation/pages/LoginPage.tsx`

- **Contenedor:** `grid min-h-screen place-items-center bg-accent px-4 py-6`.
- **Tarjeta:** cuadrada, `w-full max-w-md bg-background p-6 shadow-lg`, sin borde y sin panel navy.
- **Logo centrado dentro del h1:**
  - En claro, `trackermexico-dark.png` con `dark:hidden`.
  - En oscuro, `trackermexico.png` con `hidden dark:block`.
  - `alt="Tracker México GPS"`.
- **Subtítulo:** "Sistema de gestión comercial".
- **Formulario:**
  - `gap-6`.
  - Label e Input con `id` `login-username` y `login-password`. Se conservan `name=username`, `name=password` y `type=submit`.
  - Botón Entrar `size="lg" w-full`.
  - "Limpiar formulario" es un link ghost centrado.
- **Corregidos:** "Contrasena" → "Contraseña" y "gestion" → "gestión".
- **Sin cambios:** schema, `useLogin`, `useApiFormErrors`, `register` y `FieldError`.

## Gates

Se ejecutaron desde `frontend/` con `pnpm run typecheck && pnpm run lint && pnpm run build`, y terminan con exit 0.

```
> tsc --noEmit                 (sin salida)
> eslint .                     (sin salida)
> tsc -b && vite build
✓ 4282 modules transformed.
dist/assets/index-BmPqb-BG.js   495.57 kB │ gzip: 134.35 kB
[INEFFECTIVE_DYNAMIC_IMPORT] ... (preexistente, CalendarView/DealCard/KanbanColumn)
✓ built in 1.15s
EXIT=0
```

Prettier `--check` pasa en los 6 archivos tocados. Avisa en otros archivos de `coaching/` que no se tocaron, como `coaching.types.ts` y `coaching.api.ts`; esos avisos ya existían.

## rg (Done)

```
$ rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-|text-\[[0-9]+px\]" frontend/src/modules/{coaching,equipo,settings,import-export,auth} frontend/src/modules/reports/presentation/pages/ReportsPage.tsx
ReportsPage.tsx:37:  const STORAGE_KEY = "tracker-report-goals"
ReportsPage.tsx:230: body{font-family:'Montserrat'...background:#EEF2F7...}      (popup)
ReportsPage.tsx:232: @media print{...}                                         (popup)
ReportsPage.tsx:235: <p style="font-size:11px;color:#94A3B8...">Tip: ...</p>  (popup)
import-export/application/hooks/useExportData.ts:12:  a.download = `tracker-backup-${...}.json`
```

- **Líneas 230, 232 y 235:** pertenecen al popup, que el plan permite.
- **Línea 37:** es la clave de `localStorage`. Si se renombra, se pierden las metas que los usuarios ya guardaron. Es lógica, así que se queda.
- **`useExportData.ts`:** el match es el nombre del archivo descargado, en un hook. Es lógica y no se tocó.
- **Clases de presentación:** fuera del popup quedan 0.

Rg de clases legacy (`slabel`, `card`, `prog`, `ai-box`, `empty-state`, `seller-row`, `page-title`, `variant="success"`, `max-w-[`, `text-red-`, `bg-green-` y `rounded-[`): solo coincide un comentario en `CoachingPage.tsx:47` ("Seller cards: ..."). En los `className` no queda ninguna.

Diffs de verificación:

- `git diff --stat` sobre `ExecutiveSlide.tsx`, `LaminaPage.tsx` y `routes/lamina.tsx` sale vacío.
- `diff` del bloque `openLamina` contra HEAD da `POPUP_IDENTICAL`.

## Verificación visual (solo http://localhost:3001)

Usé Playwright (`playwright@1.62.0` de odc) con los usuarios admin, director1 y seller1. Revisé las 5 rutas y el login, a 1440 y 390, en tema claro y oscuro (forzado por `localStorage.theme`).

**Bloqueo de escrituras:** cualquier petición que no sea GET a `/api`, salvo auth, recibe un 418 en local. Peticiones bloqueadas: 0. No se escribió nada.

**En todas las combinaciones:**

- Hay un solo h1. En el login, el h1 es el logo con su alt.
- El overflow horizontal es 0.
- No hay controles sin label.
- Ningún foco carece de indicador visible.

**Contraste:**

- `FieldError` del login: 4.77 en claro y 6.85 en oscuro.
- Fallan contra 4.5:
  - El `kbd` "Ctrl K" y el avatar de la cabecera del shell, con 4.35 en claro. Están fuera del alcance.
  - El badge de TanStack devtools, que solo aparece en desarrollo.
  - El texto interno de ExecutiveSlide (lámina).

**Login:**

- Están `name=username`, `name=password` y `type=submit`.
- Se ve el logo correcto en cada tema.
- Tras un submit inválido, el foco va a `username`.

**Tablas a 390:**

- "Detalle top vendedores" mide 340/340 y "Equipo comercial" 340/340: sin scroll interno.
- Antes de los ajustes de esta fase, las dos desbordaban.

**AlertDialog de Equipo** (Escape y Cancelar): el foco vuelve a "Acciones de vendedor ...". No se confirmó ninguna acción.

**Consola:** solo aparecen los 403 preexistentes de los hooks que se lanzan antes de comprobar el rol (ver Pendiente Líder).

**Sin verificar:** la tarjeta de éxito del import, porque requiere un import real.

Los scripts (`impl011/check.cjs` y `extra.cjs`) y las capturas (`impl011/shots/`) están en el scratchpad de la sesión.

## Decisiones

- **Título de Coaching:** queda "Coaching". Mantiene la descripción original.
- **Grids:**
  - Equipo e Import/Export usan `grid-cols-12` con `col-span-*` (en Equipo, `lg:col-span-4`, que equivale a `lg:grid-cols-3`). Así el `DottedDivider` puede ser hijo directo del bento.
  - Configuración usa 3 columnas. Se quitó `max-w-[560px]` porque así se lee mejor.
- **Accordions:** se eliminaron en Reportes y en Configuración. Los parámetros y las metas quedan visibles como secciones de formulario, como en la plantilla.
- **h3 en vez de h5:** los títulos de sección dentro de los formularios son h3, para no saltar niveles bajo el h2.
- **Textos de rol y estado:**
  - Los roles se muestran con un `ROLE_LABELS` local en Equipo (Administrador, Director, Vendedor), copiado de `nav-user.tsx`, que no lo exporta.
  - Badges: los usuarios muestran Activo o Bloqueado y los vendedores Activo o De baja.
  - Las secciones del respaldo se muestran con `SECTION_LABELS`, nunca con la clave cruda.
- **Login:**
  - El h1 es el logo.
  - Se quitaron "Bienvenido", "Ingresa tus credenciales para acceder", el panel navy y la lista de beneficios, para igualar `login-1440.png`.
  - "Limpiar formulario" se conserva.
- **Crear usuario:** `autoComplete="off"` en usuario y `new-password` en contraseña, para que el navegador no rellene las credenciales del admin.
- **Retorno de foco en Equipo:**
  - El `DropdownMenuItem` que abre el AlertDialog se desmonta, así que el foco iba a `body`. Es la N8 de las reviews 009 y 010.
  - Se guarda en un `useRef` el id del botón `…` de la fila (`seller-actions-<id>` o `user-actions-<id>`), y `onCloseAutoFocus` lo enfoca.
  - Es comportamiento de UI. No afecta a datos ni a la API.
- **Configuración:** la descripción del `PageHeader` pasa a "Metas comerciales y umbrales de riesgo", para no repetir el h2 "Metas del sistema".

## Desviaciones

- **Hits del rg que se quedan:** `STORAGE_KEY "tracker-report-goals"` y `tracker-backup-` (en el hook). Ver la sección rg.
- **Mensaje "Faltan las siguientes secciones":** el mensaje de validación del import sigue mostrando las claves crudas (`sellers`, `users`, ...). Se genera en la lógica de validación del archivo, que no se puede cambiar.

## Pendiente Líder

1. **Exportar `ROLE_LABELS`** desde un módulo compartido, por ejemplo `frontend/src/shared/lib/roles.ts`, y reutilizarlo en `components/nav-user.tsx` y en `EquipoPage.tsx`, que hoy tiene una copia local.
2. **Contraste de la cabecera del shell en claro (4.35):** afecta al `kbd` "Ctrl K" del buscador y a las iniciales del avatar. Cambiar `text-muted-foreground` por `text-foreground/70`, o subir el token `--muted-foreground` en claro.
3. **ExecutiveSlide:**
   - A 390 la lámina se recorta, porque la raíz tiene `overflow-hidden` y ancho fijo interno: "$429,000.0" aparece cortado.
   - El contraste interno es de 1.83 a 3.54 (`text-white/20-38`, `tracker-text-muted`).
   - Los dos problemas quedan fuera del alcance por decisión: la lámina no se toca.
4. **403 en consola por hooks que se lanzan antes de comprobar el rol:**
   - Equipo: `useUsers` y `useSellers` se ejecutan para el seller antes del `return` de acceso denegado.
   - Coaching y Configuración: `useSettings` falla para el seller.
   - Import/Export: los hooks de configuración.
   - Arreglo: pasar `enabled: isAdmin` a esas queries. Es lógica de hooks, así que no lo cambié.
5. **Mensaje "Faltan las siguientes secciones: ..."** en la validación del import: mapear `missing` con etiquetas legibles. Hoy las etiquetas viven en `SECTION_LABELS`, en `ImportExportPage.tsx`; se podrían mover a `domain/`.
6. **Nombre del archivo de backup** en `useExportData.ts:12` (`tracker-backup-*.json`): solo se renombraría por estética, si el Líder quiere. No afecta al rg de presentación.

## Fixes post-review

Corrige M1, N1, N2 y N4 de `progress/review_81-011-remaining-pages-login.md`. N3 no se toca porque es lógica; N5 y N6 quedan para el Líder o para 012.

- **M1** (`ImportExportPage.tsx:125`):
  - Ahora el mensaje "Faltan las siguientes secciones" pasa cada clave por `SECTION_LABELS`, con la clave como fallback. La regla de validación no cambió.
  - Lo comprobé seleccionando un JSON parcial; no se importó nada. El FieldError y el toast muestran "Clientes, Contactos, Oportunidades, Tareas, Actividades, Ventas, Configuración".
  - Con esto quedan resueltos la desviación y el Pendiente Líder 5.
- **N1** (`LoginPage.tsx`):
  - Los dos `Label` llevan `text-sm text-muted-foreground`, y el form pasa de `gap-6` a `gap-4`.
  - Contraste medido con Playwright, muted-foreground sobre la card a 14px: 4.74 en claro y 7.66 en oscuro. Los dos superan 4.5, así que muted se queda.
- **N2** (`LoginPage.tsx`): el contenedor exterior ahora es `<main>`. Playwright cuenta un solo `main` en `/login`.
- **N4** (`EquipoPage.tsx`):
  - Se usa el `isError` que ya devolvía `useUsers()`, sin cambiar la query.
  - Si es true, el EmptyState muestra "Sin acceso a la lista de usuarios". Si no, sigue mostrando "Sin usuarios registrados".
  - Como director1, que recibe un 403, se ve "Sin acceso a la lista de usuarios".

Gates desde `frontend/` (`pnpm run typecheck && pnpm run lint && pnpm run build`): EXIT=0, `✓ 4282 modules transformed`, `✓ built in 1.10s`. Prettier pasa en los 3 archivos. Peticiones bloqueadas: 0. El script de comprobación es `impl011/post.cjs`, en el scratchpad.
