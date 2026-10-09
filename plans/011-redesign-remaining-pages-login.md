# Plan 011: Coaching, Reportes, Equipo, Configuración, Import/Export y Login

> **Executor instructions**: Sigue este plan paso a paso. Si ocurre algo de
> "STOP conditions", detente y reporta. Al terminar, actualiza la fila en
> `plans/README.md` y escribe `progress/impl_81-011-remaining-pages-login.md`.
>
> **Drift check**: `git diff --stat 55b22e1 -- frontend/src/modules/coaching frontend/src/modules/reports frontend/src/modules/equipo frontend/src/modules/settings frontend/src/modules/import-export frontend/src/modules/auth`

## Status

- **Feature**: 81-visual-redesign (fase 6 de 7)
- **Priority**: P1 · **Effort**: M · **Risk**: MED (la lámina comparte CSS con la app)
- **Depends on**: 008 (paralelizable con 009/010)

## Read first

- `DESIGN.md` (incluida la **excepción de la lámina**).
- `progress/explore_redesign_current.md` §4 (filas /coaching, /reportes,
  /equipo, /configuracion, /import-export, /login) y §7 puntos 1-2.
- Capturas: `progress/redesign/template/login-1440.png`, `login-390.png`,
  `form-1440.png`, `user-profile-1440.png`, `home-1440.png`.

## Scope

**In scope**: `frontend/src/modules/coaching/**`, `frontend/src/modules/equipo/**`,
`frontend/src/modules/settings/**`, `frontend/src/modules/import-export/**`,
`frontend/src/modules/auth/**`, y en `frontend/src/modules/reports/**` SOLO
`ReportsPage.tsx` sin su popup.

**Out of scope**: `ExecutiveSlide.tsx`, `LaminaPage.tsx`, `routes/lamina.tsx`
y el bloque del popup de `ReportsPage.tsx` (~158-190): la lámina conserva
navy/verde y Montserrat. Lógica, backend.

## Steps

1. **Coaching**: `PageHeader` ("Coaching" + Select de vendedor en acciones).
   SellerCoachingCard como card del bento; `StatCell` y `ProgressBar` locales
   sustituidos por `StatCard` y la barra de DESIGN.md (manteniendo `scaleX`).
   Caja de IA con header icono+título. `EmptyState`. Fuera `max-w-[1200px] p-6`
   y los `text-[Npx]`.
2. **Reportes**: `PageHeader` ("Reportes" / "Informe ejecutivo mensual";
   menú Guardar/Copiar/Compartir y "Abrir lámina" en acciones). Configuración
   de metas como sección de formulario. "Detalle top vendedores" con
   `DataTable` o la tabla a sangre de la plantilla. "Resumen para Dirección"
   como card con header (conserva `id="executive-report-text"`). La lámina
   embebida queda tal cual.
3. **Equipo**: `PageHeader`. Las 3 cards en bento responsive
   (`grid-cols-1 lg:grid-cols-3 gap-px bg-border`, hoy `grid-cols-3` fijo)
   con `CardTitle` en vez de `.slabel`. Usuarios y equipo comercial a
   `DataTable`/lista con `StatusBadge`; quitar `p-6`.
4. **Configuración**: `PageHeader`; el formulario en secciones de la
   plantilla; quitar `max-w-[560px]` solo si el bento de 2 columnas mejora la
   lectura, si no, mantener ancho y aplicar estilo.
5. **Import/Export**: `PageHeader`; las 2 cards como secciones del bento;
   lista de errores con estilo de tabla/lista, no `.empty-state`.
6. **Login**: como `login-1440.png`: `min-h-screen grid place-items-center
   bg-accent px-4`, card `max-w-md shadow-lg p-6` cuadrada, logo centrado
   (`trackermexico-dark.png` en claro, `trackermexico.png` en oscuro), sin
   panel navy. Conserva `name=username`/`name=password`/`type=submit`
   (los usa el script de capturas). Corrige "Contrasena" → "Contraseña".
7. Gates: `pnpm run typecheck && pnpm run lint && pnpm run build`.

## Done criteria

- [ ] `rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-|text-\[[0-9]+px\]" frontend/src/modules/{coaching,equipo,settings,import-export,auth} frontend/src/modules/reports/presentation/pages/ReportsPage.tsx` → 0 fuera del bloque del popup
- [ ] `ExecutiveSlide.tsx` y `LaminaPage.tsx` sin cambios (`git diff --stat`)
- [ ] typecheck, lint y build exit 0

## STOP conditions

- Rediseñar ReportsPage exige tocar el popup o ExecutiveSlide.
- El login pierde los atributos `name`/`type` o cambia el flujo de auth.

## Verificación manual (Líder)

`/lamina`, el popup "Abrir lámina" e impresión a PDF iguales que antes
(navy rgb(0,21,36), Montserrat, fondo #EEF2F7): comparar con las capturas
"antes". Login con admin, director1 y seller1.
