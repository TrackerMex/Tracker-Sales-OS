# Fallos preexistentes detectados durante la feature 81

Registrado el 2026-10-10. Ninguno lo introdujo el rediseño: todos se comprobaron contra la base `55b22e1` y ya existían allí. El usuario autorizó corregirlos el 2026-10-11, incluida la lámina. El avance y las evidencias se registran en `docs/bugfix-execution.md` y `progress/qa_82-88-bugfixes.md`. Los 14 bugs quedaron corregidos y las siete reviews independientes están PASSED. Las descripciones siguientes conservan los síntomas originales.

Fuentes: `progress/qa_81-write-smoke.md` (QA con escrituras reales), `progress/review_81-010-agenda-activities-sales.md`, `progress/review_81-011-remaining-pages-login.md` y `progress/impl_81-011-remaining-pages-login.md`.

Están ordenados por prioridad.

## Alta: datos incorrectos o flujos bloqueados

1. **El TimePicker guarda mal las horas tecleadas con cero delante.**
   - Qué pasa: al teclear "08" en la hora se guarda 12. Una tarea de las 08:15 quedó a las 00:15. Afecta a cualquier hora de 01 a 09.
   - Causa: la primera tecla pasa por `Math.max(1, …)` y se convierte en 1. La segunda se concatena, "18", que se recorta a 12.
   - Dónde: `frontend/src/components/ui/time-picker.tsx:56-62`.
   - QA: P7.

2. **Admin no puede crear tareas ni registrar actividades (HTTP 500).**
   - Qué pasa: el admin no tiene `seller_id`, así que el frontend envía `currentUser.id` como `sellerId`. La FK `tasks/activities.seller_id → sellers` falla y el servidor responde 500.
   - Además, el formulario muestra un mensaje engañoso: "No se pudo conectar. Tus datos siguen aquí, reintenta."
   - Dónde: `CreateTaskForm.tsx:134`, `useCreateTask.ts:12`, `ActivityForm.tsx:106` y `useCreateActivity.ts:12`. El mismo fallback `sellerId ?? id` aparece en otros hooks de lectura.
   - Pendiente de decidir: o el admin elige vendedor, o el backend lo rechaza con un 400 claro.
   - QA: P3.

3. **Al hacer clic en una tarea del calendario se abren "Editar" y "Crear" a la vez.**
   - Qué pasa: el clic del chip sube hasta la celda del día, que abre "Crear tarea".
   - Consecuencia: el diálogo Editar queda dentro de un `aria-hidden`, así que con teclado o lector de pantalla no se llega a "Actualizar tarea". Escape cierra Editar y deja Crear abierto.
   - Dónde: `frontend/src/modules/tasks/presentation/components/CalendarView.tsx:178` (chip) y `:384` (día).
   - QA: P1.

## Media: errores visibles al usuario

4. **Soltar un deal en su misma columna del pipeline da error.**
   - Qué pasa: la API responde 400 y aparece el toast "No se pudo cambiar la etapa".
   - Arreglo: falta comprobar en el drop que la etapa de origen y la de destino sean distintas.
   - Dónde: `frontend/src/modules/pipeline/presentation/components/KanbanColumn.tsx:33`.

5. **Al completar una tarea, Actividades muestra "Sin cliente".**
   - Qué pasa: la navegación a `/actividades/nueva` no lleva `clientName`.
   - Es solo visual: el `clientId` se guarda bien.
   - Dónde: `AgendaPage.tsx:172` (`handleComplete`).
   - QA: P4.

6. **Hay consultas que se lanzan antes de comprobar el rol y devuelven 403.**
   - Cuáles:
     - Director: `GET /api/users`.
     - Seller: `GET /api/reports/monthly`, `/api/reports/win-loss`, `/api/users` y `useSettings`.
     - También hooks de Coaching, Configuración e Import/Export.
   - Si el seller entra en `/reportes` por URL ve "Error al cargar el reporte."
   - Arreglo: `enabled` según el rol en esas queries.
   - Review 011: N6.

7. **El diálogo de confirmación de Equipo no da feedback.**
   - Qué pasa: al confirmar una baja o un bloqueo, el diálogo se cierra sin mostrar "Procesando…" y no hay toast si falla.
   - Dónde: `EquipoPage.tsx:513`.
   - Review 011: N3.

8. **Un deal cuyo cliente se borró sigue en el pipeline.**
   - Qué pasa: al abrir su Sheet, la query `["clients", id]` devuelve `undefined` y TanStack lanza un error en consola.
   - Dónde: `ClientDetailPage.tsx:71`, que busca con `getClients({ limit: 100 }).find(...)` en vez de pedir el cliente por id.
   - QA: P6.

## Baja: accesibilidad y detalles

9. **El foco se pierde al cerrar cualquier diálogo.**
   - Qué pasa: el foco vuelve a `body`, incluso al cancelar con Escape.
   - Causa: los diálogos se controlan por estado y no tienen `DialogTrigger`, así que Radix no sabe a qué elemento devolver el foco.
   - QA: P2.

10. **El formulario de actividad vacío no muestra los errores de la app.**
    - Qué pasa: el `required` nativo bloquea el envío antes y se ve "Please fill out this field."
    - Arreglo: `noValidate` en el form.
    - QA: P5.

11. **Ventas con admin a 390 px.**
    - Qué pasa: la tabla desborda 74 px y el botón "…" queda fuera de pantalla. Hay que hacer scroll horizontal dentro de la tabla.
    - QA: P8.

12. **Textos inconsistentes.**
    - El select de rol de Equipo dice "Comercial" y "Dirección / Admin" (`EquipoPage.tsx:358-359`), pero la lista dice "Vendedor" y "Administrador".
    - Configuración usa "deals estancados" (`SettingsPage.tsx:22-23`).

13. **La lámina ejecutiva no se adapta a móvil.**
    - Qué pasa: a 390 px se corta y tiene fallos de contraste internos.
    - Quedó fuera del rediseño de la feature 81. El usuario autorizó corregir su vista móvil y contraste en la feature 88.

## Herramientas

14. **`pnpm run typecheck` no comprueba nada.** El `tsconfig.json` raíz tiene `files: []`. La comprobación de tipos real es el `tsc -b` que corre dentro de `pnpm run build`.


## Seguimiento de correcciones — 2026-10-11

| Bugs | Feature | Estado |
|---|---|---|
| 14 | 82-frontend-typecheck | Corregido; review PASSED |
| 1, 3 | 83-timepicker-calendar | Corregidos; review PASSED |
| 2 | 84-admin-seller-assignment | Corregido; review PASSED |
| 4, 5, 8, 10 | 85-client-pipeline-integrity | Corregidos; review PASSED |
| 6, 7 | 86-role-queries-team-feedback | Corregidos; review PASSED |
| 9, 11, 12 | 87-dialog-mobile-copy | Corregidos; review PASSED |
| 13 | 88-executive-slide-responsive | Corregido; review PASSED |

El bug 6 se acotó contra los permisos reales: Settings permite lectura a los tres roles, Coaching permite el flujo propio y los hooks Import/Export son mutaciones sin consulta automática. Se corrigieron Users y Reportes, conservando esas operaciones autorizadas. La review de 86 también detectó y corrigió la reactivación y sincronización de cuentas mediante la asociación real `users.seller_id`, con compatibilidad legacy y protección de cuentas ajenas/borradas.

## Seguimiento del reporte de actividad — 2026-10-11

El usuario detectó un caso manual adicional en Actividades: elegir una tarea mantenía el cliente anterior y el servidor respondía «La actividad debe conservar el cliente de la tarea». Corregido en `89-activity-task-client-sync`: tarea/cliente y nombre sincronizados, limpieza de contacto/oportunidad, desvinculación visible al cambiar cliente y contexto fijo desde Agenda/Mi Día. La validación backend permanece. Review PASSED 5/5; baseline 16/16 y QA after 158/158, con gates frontend PASS. Evidencia en `progress/qa_89-activity-task-client-sync.md`. Destino dev; producción pendiente del paso de despliegue.
