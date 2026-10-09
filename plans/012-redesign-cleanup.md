# Plan 012: Limpieza final del rediseño y verificación

> **Executor instructions**: Sigue este plan paso a paso. Si ocurre algo de
> "STOP conditions", detente y reporta. Al terminar, actualiza la fila en
> `plans/README.md` y escribe `progress/impl_81-012-cleanup.md`.
>
> **Drift check**: los planes 006-011 tienen que estar en DONE en
> `plans/README.md`. Si no, STOP.

## Status

- **Feature**: 81-visual-redesign (fase 7 de 7)
- **Priority**: P1 · **Effort**: S · **Risk**: MED (borrar CSS que la lámina pueda usar)
- **Depends on**: 006-011

## Scope

**In scope**: `frontend/src/index.css`, `frontend/src/components/ui/button-variants.ts`
y `badge-variants.ts` (quitar alias), `frontend/src/main.tsx`,
`plans/README.md`.

**Out of scope**: módulos (si queda un uso legacy en un módulo, STOP y
reporta: lo arregla la fase correspondiente).

## Steps

1. Para cada clase legacy de `index.css`, `rg` su uso en `frontend/src`. Borrar
   las que tengan 0 usos fuera de `index.css`. Las que use la lámina
   (`ExecutiveSlide`, `LaminaPage`) se quedan, agrupadas bajo un comentario
   "Lámina ejecutiva".
2. Borrar tokens `--tracker-*` / `--color-tracker-*` que ya nadie use
   (comprobar uno por uno; la lámina usa varios).
3. Quitar la variante `success` de Button y las variantes tracker de Badge si
   no tienen usos.
4. Si `@fontsource-variable/montserrat` solo lo usa la lámina, se queda; si
   no lo usa nadie, quitar import y dependencia.
5. Barrido global:
   `rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-|text-\[[0-9]+px\]" frontend/src/modules frontend/src/shared frontend/src/components`
   → solo ExecutiveSlide, LaminaPage y el popup de ReportsPage.
6. Contraste pendiente de la review 008 (N7), 4.35:1 en claro: `kbd` "Ctrl K"
   del Header, iniciales del Avatar y Badge `gray` (ya corregido por el Líder en 010) (`text-muted-foreground`
   sobre `bg-muted`). Subir el texto a `text-foreground` o quitar el fondo
   `bg-muted` hasta llegar a ≥ 4.5:1, medido con Playwright. Scope extra:
   `frontend/src/shared/components/layout/Header.tsx` y `frontend/src/components/ui/avatar.tsx`.
7. Review 009 N3/N4: los tres arrays locales de orden de etapas
   (`ClientesPage.tsx`, `ClientDetailPage.tsx`, `PipelinePage.tsx`) importan
   `PIPELINE_STAGES` de `shared/lib/constants.ts`; borrar las reglas
   `.pipeline-scroll::-webkit-scrollbar*` con hex de `index.css`. Scope extra:
   esos tres archivos, solo ese cambio.
8. Review 010 (`progress/review_81-010-agenda-activities-sales.md`):
   - **M3.** `DatePickerField` y `TimePickerField` aceptan un prop `id` opcional (en el trigger o el grupo, con `role="group"` y aria-labels por campo). Los 13 `Label` de tasks, activities y sales pasan a tener `htmlFor`.
   - **N3.** Ids únicos para los `FieldError` de Dirección y ATC en `SalesPage`.
   - **N4/N5.** `ClientCombobox` acepta `aria-describedby`, y ActivityForm le pasa `aria-invalid` con el error local.
   - **N7.** La columna Tipo de Ventas muestra etiqueta legible, no el valor crudo.
   - **N11.** Contraste del contacto vencido en MiDia.
   - Scope extra: esos archivos, solo esos cambios.
9. Gates: `pnpm run typecheck && pnpm run lint && pnpm run build`.

## Done criteria

- [ ] `index.css` sin clases legacy salvo el bloque de la lámina
- [ ] Barrido del Step 5 limpio
- [ ] typecheck, lint y build exit 0

## STOP conditions

- Un módulo fuera de la lámina sigue usando una clase o token legacy.
- Borrar algo cambia el aspecto de `/lamina` o del popup.

## Verificación final (Líder)

Capturas "después" de todas las rutas en `progress/redesign/after/`
(1440 claro, 1440 oscuro, 390 claro; Admin, Director y Seller), comparadas
con `progress/redesign/current/` y `progress/redesign/template/`. Smoke
funcional de los planes 009-011. CHECKPOINT de la feature 81 en
`CHECKPOINTS.md`. El merge a `main` y el despliegue los decide el usuario:
nada de push.
