# QA 81 — Smoke funcional con escrituras reales (stack local)

Fecha: 2026-10-10 (≈00:29–00:55 UTC). Entorno: frontend `http://localhost:3001` (Vite con `VITE_API_URL=http://127.0.0.1:3005`), API `127.0.0.1:3005`, Postgres `127.0.0.1:5434` (solo lectura).
Herramienta: Playwright 1.62 Chromium, `reducedMotion: 'reduce'`, tema por `localStorage.theme`.
Salvaguarda: cada contexto aborta toda petición a `:3000` o al proxy `localhost:3001/api` (que apunta a producción). La lista de peticiones bloqueadas quedó **vacía** en todas las ejecuciones: no hubo tráfico a producción.

Scripts: `scratchpad/qa81/{lib.cjs, seller.cjs, admin.cjs, overflow.cjs}` y `scratchpad/tools/smoke009.cjs`.
Capturas y logs (`smoke.txt`, `result.json`) por ejecución: `progress/redesign/qa81/<ejecución>/`.

## Resultado por flujo

| # | Flujo | Rol | Tema / ancho | Resultado |
|---|-------|-----|--------------|-----------|
| 1 | Clientes: crear "QA81 Cliente S1" | seller1 | claro 1440 | PASS |
| 2 | Agenda lista: crear (10:30) → editar título + hora (11:45) → eliminar | seller1 | claro 1440 | PASS |
| 3 | Agenda lista: crear → Completar → `/actividades/nueva` con la tarea precargada | seller1 | claro 1440 | PASS, con una observación: el combobox de cliente muestra "Sin cliente" (ver P4) |
| 4 | Agenda calendario: clic en el día → Crear con fecha precargada → guardar → abrir el chip → editar → eliminar | seller1 | claro 1440 | PASS, con el bug conocido del doble diálogo (ver P1) |
| 5 | Actividades: registrar (Correo, +1), puntos 0→1, aparece en "Actividades de hoy", abrir "Ver historial" | seller1 | claro 1440 | PASS |
| 6 | Actividades: validación | seller1 | claro 1440 | PASS parcial: el envío vacío no manda nada, pero no salen FieldErrors (ver P5). Con resumen y sin cliente sí sale `#clientId-error` |
| 7 | Ventas: venta de vendedor por 1234.50; la lista muestra "$1,234.50"; el vendedor no tiene menú "…" | seller1 | claro 1440 | PASS |
| 8 | Agenda lista: crear → editar → eliminar | seller1 | oscuro 390 | PASS |
| 9 | Actividades: registro manual (Chat, +1), puntos 1→2, lista, historial y validación | seller1 | oscuro 390 | PASS (misma nota P5) |
| 10 | Ventas: venta de vendedor por 1234.50 → "$1,234.50" | seller1 | oscuro 390 | PASS |
| 11 | Agenda: crear tarea | admin | claro 1440 | FAIL: HTTP 500, preexistente (ver P3) |
| 12 | Agenda calendario: filtro "Filtrar por vendedor" visible; abrir un chip ajeno y cerrarlo sin guardar | admin | claro 1440 | PASS (doble diálogo conocido) |
| 13 | Actividades: validación | admin | claro 1440 | PASS (misma nota P5) |
| 14 | Actividades: registrar con cliente QA81 | admin | claro 1440 | FAIL: HTTP 500, preexistente (ver P3) |
| 15 | Ventas: Dirección 1234.50 con vendedor "Dirección Comercial" → "$1,234.50" | admin | claro 1440 | PASS |
| 16 | Ventas: ATC 81 u / 81.81 con vendedor "Dirección Comercial" | admin | claro 1440 | PASS |
| 17 | Ventas: editar la venta de Dirección desde "…" (EditSaleModal) → 2345.67 → "$2,345.67" | admin | claro 1440 | PASS |
| 18 | Ventas: eliminar Dirección, ATC y las 2 ventas de vendedor QA81 | admin | claro 1440 | PASS (DELETE 204) |
| 19 | Agenda calendario: abrir un chip (solo lectura) | admin | oscuro 390 | PASS (doble diálogo conocido) |
| 20 | Actividades: validación | admin | oscuro 390 | PASS (misma nota P5) |
| 21 | Ventas: ATC crear (82.82) → editar (83.83) → eliminar | admin | oscuro 390 | PASS |
| 22 | Clientes: eliminar "QA81 Cliente S1" | admin | oscuro 390 | PASS |
| 23 | `smoke009.cjs` (Pipeline + Clientes) | admin | claro 1440 | 15/16 PASS. Falla "no console/page errors" por el 400 conocido y por P6 |
| 24 | `smoke009.cjs` (Pipeline + Clientes) | admin | oscuro 390 | 10/11 PASS. Falla "no console/page errors" por P6 |

Comprobado en la BD (solo lectura):
- **Tareas:** se guardan título y hora editados (por ejemplo `eec86d81` con "… editada" a las 11:45). Todas las tareas QA81 tienen `deleted_at`.
- **Ventas de Dirección y ATC:** `seller_id` = Dirección Comercial.
- **Edición de ventas:** se persisten los importes (2345.67 y 83.83) y las notas "QA81 editada …". Las 5 ventas tienen `deleted_at`.
- **Actividades:** las 2 actividades tienen `points=1`. La primera queda vinculada a la tarea `9ddfa285`, que pasó a `Completado`.
- **Cliente:** tiene `deleted_at`.

## Errores por flujo

### HTTP ≥ 400

| Código | Petición | Causa |
|---|---|---|
| 500 | `POST /tasks` | Admin, P3 |
| 500 | `POST /activities` | Admin, P3 |
| 409 | `POST /tasks` | Se esperaba: lo provocó una tarea mía de un intento anterior, que ocupaba el mismo hueco (10/10 a las 11:05). Es una regla de negocio, no un bug |
| 400 | `PATCH /deals/:id/stage` | smoke009; es el bug conocido de soltar un deal en su propia columna |

### Errores de consola

- Los "Failed to load resource" de las respuestas de la tabla anterior.
- `Query data cannot be undefined … ["clients","f00634b0-…"]` (P6).
- No hubo ningún `pageerror`.

### Toasts inesperados

- "No se pudo crear la tarea" y "No se pudo registrar la actividad": admin, vienen de los 500.
- El resto de toasts fueron los de éxito esperados: "Cliente creado", "Tarea creada", "Tarea actualizada", "Tarea eliminada", "Tarea completada", "Actividad registrada", "Venta registrada", "Venta actualizada" y "Cliente eliminado".

### Foco al cerrar diálogos

El foco se pierde (`document.activeElement` pasa a ser `BODY`) en **todos** los diálogos, incluso al cancelar con Escape (ver P2).

## Hallazgos: preexistentes y posibles regresiones

**Posibles regresiones de la feature 81: ninguna.** Todo lo que se encontró se comparó con la base `55b22e1` (`git show`, solo lectura) y está igual allí.

### Preexistentes

| ID | Hallazgo | Evidencia en la base |
|----|----------|----------------------|
| P1 | **Bug conocido.** Clic o Enter en un chip del calendario abre a la vez "Editar tarea" y "Crear tarea con objetivo". Además, el diálogo Editar queda dentro de un subárbol `aria-hidden=true`, que el modal de Crear aplica al resto de la página. Un lector de pantalla, o cualquier selección por rol, no llega a "Actualizar tarea"; con clic de ratón sí se guarda (PATCH 200). Escape cierra primero Editar y deja Crear abierto. | Bug ya conocido. `CalendarView` no cambia el comportamiento del clic |
| P2 | El foco vuelve a `body` al cerrar cualquier diálogo: crear, editar o eliminar tarea, historial, EditSaleModal y los AlertDialog de eliminar. Pasa incluso al cancelar con Escape. Los diálogos son controlados por estado y no usan `DialogTrigger`, así que Radix no tiene a qué elemento devolver el foco. | En la base hay 0 `DialogTrigger` en CreateTaskForm, AgendaPage, ClientesPage, EditSaleModal y ActivityHistoryModal. Los diffs de `dialog.tsx` y `alert-dialog.tsx` son solo de estilo |
| P3 | El admin no tiene `seller_id`. Al crear una tarea o una actividad, el frontend envía `sellerId = currentUser.id`; el backend devuelve 500 por la FK `tasks/activities.seller_id → sellers`. El mensaje que aparece en el formulario es engañoso: "No se pudo conectar. Tus datos siguen aquí, reintenta." | La base tiene el mismo fallback `currentUser?.sellerId ?? currentUser?.id` en CreateTaskForm y ActivityForm. `api-errors.ts` no tiene cambios respecto a la base |
| P4 | Al pulsar Completar, la navegación a `/actividades/nueva` no lleva `clientName`, porque la respuesta de completar no lo trae. El combobox muestra "Sin cliente" aunque `clientId` está puesto, y la actividad sí se guarda con el cliente. | La base tiene la misma lógica de `handleComplete` |
| P5 | ActivityForm: al enviar el formulario vacío lo bloquea el `required` nativo del resumen ("Please fill out this field."). Por eso no aparecen FieldErrors de la app, aunque tampoco se envía nada. La validación de cliente sí muestra `#clientId-error`. | La base tampoco tiene `noValidate` y tiene los mismos 2 `required` |
| P6 | El deal auto-creado para un cliente con soft-delete sigue en el pipeline. Al abrir su Sheet, la query `["clients", id]` hace `getClients({limit:100}).find(...)`, que devuelve `undefined`, y TanStack lanza un error en consola. Aquí lo disparó el dato de prueba QA81. | `ClientDetailPage.tsx` es idéntico en la base |
| P7 | **Bug nuevo detectado, no es regresión.** En TimePicker, al teclear "0" y luego "8" en la hora, el valor queda en **12**. La primera tecla se fija en 1 por `Math.max(1, …)` y la segunda se concatena ("18", que se recorta a 12). Así, 08:15 se guardó como 00:15 (12:15 a.m.). Afecta a cualquier hora de 01 a 09 tecleada con cero delante. | `components/ui/time-picker.tsx` tiene el mismo código en la base |
| P8 | Menor y visual. Con admin en `/ventas` a 390 px, el contenedor de la tabla desborda 74 px (scrollWidth 414 frente a 340) y el botón "…" queda fuera de la pantalla (x=423). Hay que hacer scroll horizontal dentro de la tabla. La página en sí no tiene scroll horizontal. | La base no tenía colapso responsive (0 `md:table-cell`), así que la tabla era aún más ancha. No es regresión |

Notas:
- El 400 de smoke009 es el conocido (soltar un deal en su propia columna).
- La vista Lista/Calendario se guarda en `localStorage` (`agenda_view_mode`). Es el diseño previsto, no un bug, pero conviene tenerlo en cuenta: si se abre la Agenda en Calendario, la lista no aparece.

## Datos que quedan en la BD

**No se pueden borrar desde la UI** (no hay endpoint ni opción):
- **Actividad** `13b612f3-40af-4f6c-8b14-16bf157dd501`: Correo, 1 pt, seller1, `task_id` 9ddfa285. El summary empieza por "QA81 actividad desde tarea light1440".
- **Actividad** `c7a15c1f-38c0-4698-8d18-231b93253f14`: Chat, 1 pt, seller1. El summary empieza por "QA81 actividad manual dark390".
- Por estas dos actividades, seller1 tiene hoy 2 pts más.
- **Deal** `96ea6939-2299-4178-9838-d84f9cfd8e27` ("QA81 Cliente S1"):
  - lo creó automáticamente el backend al registrar la primera actividad;
  - está en Prospecto, con `version` 3 y 2 entradas en `stage_history`, porque smoke009 lo arrastró a Contactado y lo devolvió;
  - sigue visible en el pipeline aunque el cliente está borrado.
- **audit_logs:** 2 filas `change_stage` de ese deal (00:51:06 y 00:51:08).

**Con soft-delete** (`deleted_at` puesto):
- Cliente `f00634b0-96d0-4e21-a664-82f37fed3e08` "QA81 Cliente S1".
- Tareas: `eec86d81-42b3-4390-adfe-eeebd0894142`, `9ddfa285-fbcb-49dd-b183-0cd85ff4c0fc`, `cda9a800-8962-4c91-ad6c-8cf77a01c786`, `4889fdaa-8225-4c2a-83f3-9f9e61a48a16`, `aee04d43-872c-4203-8b65-82f8be220efb`, `dd789a8d-0577-4dbd-810f-d6bfc41bd2db`, `5055a99b-1542-4b04-b7fb-f3c4c33fff30` y `a684c685-a3d1-4cf7-a19d-525bd7e3c6ea`.
- Ventas: `a3ed0624-ac0d-40af-bfe9-c830e2031ca3`, `063e6a27-984e-48ad-bb81-689c5352f9ba`, `86010fd1-3e3e-4bed-ab5b-69d5b485ab74`, `a74072f3-900d-4fdc-be4c-21b145d38633` y `0d044a2c-07ef-4c2f-8710-8653959826ab`.
- Clientes de smoke009: `165cfe88-f030-495a-ba12-5b190ef60b53` "Smoke 81 77808 ed" y `e1d73041-d656-40f6-98a9-919cdbc560da` "Smoke 81 27714 ed". El script usa su propio prefijo "Smoke 81", no QA81.

**Registros ajenos:**
- No se modificó ninguno. Comparé un volcado de `deals` antes y después de smoke009 y solo cambió el deal QA81: el arrastre cogió la primera tarjeta de Prospecto, que era la mía.
- El chip ajeno del calendario (tarea de Juan Pérez de las 16:00) se abrió y se cerró sin guardar; no hubo ningún PATCH.

## Ejecuciones

| Carpeta | Contenido |
|---|---|
| `s1-light-1440` | seller1 completo. El flujo de calendario falló porque usaba 07:05, que P7 convirtió en 00:05 |
| `s1-light-1440-b` | Reintento del calendario con limpieza. Aquí está el 409 provocado por un resto mío del intento anterior |
| `s1-light-1440-c` | Calendario sobre un estado limpio: PASS |
| `s1-dark-390` | seller1 a 390 px en oscuro |
| `admin-light-1440`, `admin-dark-390` | Flujos de admin |
| `admin-dark-390-overflow` | Medición de P8 |
| `smoke009-light-1440`, `smoke009-dark-390` | `smoke009.cjs` |
