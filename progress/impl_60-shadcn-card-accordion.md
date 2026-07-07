# impl_60-shadcn-card-accordion

## Ya hecho (sesion anterior, sin commitear)

Los siguientes archivos ya tenian Card/Accordion de shadcn aplicados correctamente antes de esta sesion, no se tocaron:

- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx` — bloque info cliente con `Card` + `Accordion` (contacts/pain/provider); bloque timeline con `Card`; ambos hermanos dentro del `Sheet`, sin anidamiento.
- `frontend/src/modules/activities/presentation/components/ActivityHistoryModal.tsx` — bloque "Estado actual" con `Card`; historial con `Accordion` de una sola seccion; hermanos dentro del `Dialog`.
- `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx` — filtros y "Detalle Top Vendedores"/"Resumen para Direccion" con `Card`/`Accordion`. `ExecutiveSlide.tsx` no se toco (permanece 100% inline-style, requerido por el export via `window.open` + `outerHTML`).
- `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx` — grupos de metas (daily/monthly/risk) en `Accordion` dentro de `Card`, ya conforme.
- `frontend/src/components/ui/card.tsx` y `frontend/src/components/ui/accordion.tsx` — ya re-estilizados con tokens tracker.

## Bug arreglado

Archivo: `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`, linea 359.

- Antes: bloque "Contactos" del sidebar oscuro (abre en `<div>` linea 345) cerraba con `</Card>` huerfano (no habia `<Card>` abierto en ese bloque).
- Despues: cierra con `</div>`, balanceado con el `<div>` de apertura.

El sidebar (`style={{ background: "#001524" }}`, linea 333) se mantiene como `<div>` custom de tema oscuro — no se convirtio a `Card` (que es claro/blanco), conforme al criterio del checkpoint.

## Decisiones de alcance (no tocado)

- `ClientesPage.tsx` lineas ~768-853 (contactos editables del formulario create/edit dentro del `Dialog` de crear/editar cliente): se dejaron sin `Accordion`. Es edicion activa de datos (inputs para 1-N contactos), colapsar en Accordion añadiria friccion al capturar contactos nuevos.
- `ExecutiveSlide.tsx`: no se toco, permanece inline-style puro, requerido para el export via `window.open` + `outerHTML`.
- No se crearon Cards anidadas dentro de otras Cards en ningun archivo.

## Resultado tsc

`npx tsc --noEmit` en `frontend/` — exit code 0, sin errores.
