# Impl — Patrón de feedback de errores en formularios

**Fecha**: 2026-06-09
**Origen**: Bug 2 de `progress/qa_smoke_2026-06-09.md` + brief confirmado vía /impeccable shape
**Estado**: in_progress

## Brief confirmado

- **Patrón**: error inline por campo + banner resumen en el form. Sin toasts, sin dependencias nuevas.
- **Alcance**: production-ready, todos los forms de mutación: cliente (modal en ClientesPage), ActivityForm, CreateTaskForm, SaleFormBase (3 variantes en SalesPage), SettingsPage, LoginPage.
- **Diseño**: Restrained, light theme, tokens DESIGN.md. Paleta error: bg #fee2e2, texto #b91c1c, border 1px completo (PROHIBIDO side-stripe/border-left grueso). Banner rounded-lg con icono + lista si hay >1 error. Mensaje de campo: 11px debajo del input, input con borde danger.
- **Parser**: util que mapea respuesta 400 de NestJS (array class-validator en inglés) a mensajes en español por campo, con diccionario de constraints (isUuid, isEnum, isEmail, isNotEmpty, maxLength...) y fallback del mensaje crudo al banner. 403 → "No tienes permisos para esta acción". Red/500 → "No se pudo conectar. Tus datos siguen aquí, reintenta."
- **Interacción**: error aparece al responder submit; focus al primer campo con error; error de campo se limpia al editar; banner persiste hasta nuevo submit. `role="alert"` en banner; `aria-invalid` + `aria-describedby` en inputs. Icono + texto (no solo color).
- **Éxito/submitting**: conservar comportamiento actual (botón "Guardando...", modal cierra al éxito).

## Archivos objetivo

Nuevos (shared):
- `frontend/src/shared/lib/api-errors.ts` — parser + diccionario
- `frontend/src/shared/components/forms/FormErrorSummary.tsx` — banner
- `frontend/src/shared/components/forms/FieldError.tsx` — mensaje por campo

Modificar:
- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx` (reemplaza `<p>No se pudo guardar</p>` línea ~661)
- `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`
- `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
- `frontend/src/modules/sales/presentation/components/SaleFormBase.tsx`
- `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx`
- `frontend/src/modules/auth/presentation/pages/LoginPage.tsx`

## Criterio de éxito

1. Repro del QA: como seller crear cliente con fuente "Facebook" → banner + campo fuente marcado con mensaje en español (no falla silenciosa).
2. Login con password incorrecta → mensaje claro en LoginPage.
3. Sin red (backend caído) → banner de conexión, datos del form intactos.
4. `npm run build` del frontend pasa sin errores de tipos.

## Resultado Implementer

**Fecha**: 2026-06-09 — `npm run build` pasa (tsc -b + vite build OK).

### Archivos nuevos (shared)

- `frontend/src/shared/lib/api-errors.ts` — `parseApiError(error): ParsedApiError` clasifica: 400-validación (parsea mensajes class-validator, extrae nombre de campo incl. anidados `contacts.N.email`, traduce constraints comunes a español con diccionario regex, fallback del mensaje crudo), 401 → "Credenciales incorrectas.", 403 → "No tienes permisos para esta acción.", sin respuesta/5xx → "No se pudo conectar. Tus datos siguen aquí, reintenta.". Incluye diccionario de labels en español para el listado del banner. Exporta también el hook `useApiFormErrors(error)` que devuelve `{ summary, fieldErrors, clearField, formRef }`: sincroniza fieldErrors al llegar un error nuevo, hace focus al primer campo `aria-invalid` (o scroll al banner si no hay campo) y permite limpiar el error de un campo al editarlo.
- `frontend/src/shared/components/forms/FormErrorSummary.tsx` — banner `role="alert"`, bg #fee2e2, texto #b91c1c, border 1px completo #fca5a5, rounded-lg, icono SVG + mensaje único o lista (`<ul>` si hay >1 detalle). Sin border-left de acento.
- `frontend/src/shared/components/forms/FieldError.tsx` — `<FieldError name message>` (11px, #b91c1c, bajo el input, id `<name>-error`) + helper `fieldErrorProps(name, message)` que devuelve `aria-invalid`/`aria-describedby`.

### Soporte (fuera de la lista original, mínimos)

- `frontend/src/index.css` — clase `.input-error` (border danger) para marcar inputs con error.
- `frontend/src/shared/lib/axios.ts` — el interceptor 401 ya no redirige cuando la URL es `/auth/login` (antes recargaba la página de login y se perdía el mensaje de credenciales; necesario para el criterio 2).

### Forms integrados

- `clients/presentation/pages/ClientesPage.tsx` — hook con `createClient.error ?? updateClient.error`; banner al inicio del form del modal (reemplaza `<p>No se pudo guardar</p>`); todos los campos top-level envueltos con FieldError + aria + `.input-error`; `updateForm` limpia el error del campo editado; `openCreate`/`openEdit` resetean las mutaciones. Errores anidados de contactos van al banner con label "Contacto N — Campo" (sin inline en la grilla de contactos).
- `activities/presentation/components/ActivityForm.tsx` — nueva prop `submitError?: unknown`; banner tras el header; inline + clear-on-edit en clientId, contactId, type, result, summary, discovery, agreement, executedAt (fecha+hora comparten mensaje), nextStep, nextObjective, nextDate, nextTime. Se eliminó la variable muerta `points`.
- `activities/presentation/pages/ActivitiesPage.tsx` — pasa `error` de useCreateActivity como `submitError`; resetea la mutación al alternar el form.
- `tasks/presentation/components/CreateTaskForm.tsx` — prop `error` cambia de `string | null` a `unknown`; FormErrorSummary reemplaza el div de error custom; inline en clientId, type, contactId, title (textarea objetivo) y scheduledAt (fecha/hora).
- `tasks/presentation/pages/AgendaPage.tsx` — elimina el estado `createError` string; pasa el error crudo de la mutación y usa `reset()` al abrir/cerrar el modal.
- `sales/presentation/pages/SalesPage.tsx` — 3 instancias de `useApiFormErrors` (vendedor / dirección / ATC); banner por form (reemplaza los `<p>No se pudo registrar la venta</p>`); inline + clear-on-edit en todos los campos visibles. En dirección, errores de `product`/`clientName` se muestran bajo "Cuenta / Proyecto".
- `sales/presentation/components/SaleFormBase.tsx` — integrado igual (prop `submitError?: unknown`). Nota: este componente NO está montado en ninguna página; los 3 forms reales viven inline en SalesPage (el brief asumía lo contrario). Se integró en ambos por consistencia.
- `settings/presentation/pages/SettingsPage.tsx` — banner dentro del card + inline por campo (los nombres del form coinciden con el DTO); `handleChange` limpia el error del campo.
- `auth/presentation/pages/LoginPage.tsx` — banner FormErrorSummary reemplaza el `<p>Credenciales incorrectas</p>` estático (ahora distingue 401 / red / validación); errores zod y de servidor se muestran con FieldError (mismo estilo 11px #b91c1c).

### Desviaciones / fixes extra para que el build pase (errores preexistentes, no introducidos por esta feature)

- `core/domain/types/common.types.ts` — `enum UserRole` viola `erasableSyntaxOnly` del tsconfig; convertido a const object + tipo derivado (API idéntica: `UserRole.Admin` y el tipo `UserRole` siguen funcionando).
- `sales/domain/sales.types.ts` — `import { ID }` → `import type { ID }` (verbatimModuleSyntax).
- `routes/_app/actividades.nueva.tsx` — `validateSearch` ahora anota retorno con propiedades opcionales; corrige errores de tipos en Header.tsx y AgendaPage al navegar sin search.
- `dashboard/presentation/pages/DashboardPage.tsx` — eliminadas funciones muertas `formatPercent`/`formatNumber` (TS6133).
