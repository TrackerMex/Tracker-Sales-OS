# Implementación 72 — Visual system native buttons

## Resultado

Se migraron a `Button` de shadcn/ui las 22 ocurrencias nativas incluidas en el
plan 002. `MiDiaPage.tsx` conserva la única excepción documentada
`seller-pick-card`. También se eliminaron las reglas CSS legacy `.btn-*`.

## Archivos modificados

- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`
- `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`
- `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
- `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`
- `frontend/src/modules/auth/presentation/pages/LoginPage.tsx`
- `frontend/src/index.css` (únicamente reglas `.btn-*` y referencias responsive)
- `plans/README.md` (estado del plan 002)
- `progress/impl_72-visual-system-native-buttons.md`

## Preservación de comportamiento

- Se conservaron handlers, estados `disabled`, tipos, títulos y props existentes.
- Los seis controles icon-only del calendario y el cierre del detalle tienen
  nombres accesibles mediante `aria-label`.
- `TaskChip` conserva `ref={taskRef}`, el `onClick`, el nodo button generado por
  shadcn, la opacidad dinámica de drag/estado y el cursor `grab`; continúa
  registrado con `@atlaskit/pragmatic-drag-and-drop`.
- Los colores dinámicos de los stepper buttons permanecen en `style`; el resto
  de su presentación pasó a variantes y clases.
- No se modificó `button-variants.ts` ni se agregaron dependencias.

## Verificaciones ejecutadas

- Drift contra `cc0b102`: solo 18 inserciones esperadas de tokens del plan 001
  en `frontend/src/index.css`; inventario inicial exacto de 23 botones.
- `npm run typecheck` desde `frontend/`: exit 0.
- `npm run lint` desde `frontend/`: exit 0.
- `npm run build` desde `frontend/`: exit 0 al ejecutarse fuera del sandbox.
  El primer intento dentro del sandbox falló al cargar el binario nativo de
  Tailwind/Vite (`spawn EPERM` y stream no UTF-8), no por errores del código.
- `rg -c '<button' frontend/src/modules`: única salida
  `frontend/src/modules\\mi-dia\\presentation\\pages\\MiDiaPage.tsx:1`.
- `rg -n 'btn-(primary|green|ghost|danger|sm)' frontend/src`: sin coincidencias.
- `rg -n 'TOGGLE_STYLE|CSSProperties' ActivityForm.tsx`: sin coincidencias.
- `git diff --check`: sin errores de whitespace.
- `git diff -- frontend/src/components/ui/button-variants.ts`: sin cambios.

## Verificación manual pendiente

Se levantó Vite para intentar el smoke manual, pero la sesión del Implementer
no expuso un navegador automatizable (`No browser is available`). Quedan
pendientes, sin afirmarse como aprobadas:

1. En `/agenda`, arrastrar una tarea entre días y comprobar movimiento,
   opacidad durante drag y apertura de edición al hacer click.
2. Smoke visual de `/clientes`, detalle de deal en `/pipeline`,
   `/actividades/nueva`, `/agenda` y `/login`.

## Verificación del Líder y Reviewer

- Reviewer independiente: **PASSED (code/pre-smoke)**; 9/10 criterios del
  CHECKPOINT verificados.
- El Líder levantó Vite y confirmó en navegador que `/login` carga, que los
  botones `Entrar` y `Limpiar formulario` se renderizan y son interactivos, y
  que el estado de error conserva los datos del formulario.
- El backend local no estaba disponible, por lo que no fue posible autenticar
  ni verificar las rutas protegidas o el drag-and-drop de `/agenda`. Ese único
  criterio permanece abierto y no se declara aprobado.

## Cierre del smoke autenticado

El 2026-07-15 se repitió el smoke con backend local disponible:

- Login administrativo exitoso.
- `/clientes`: filtros, nombres y acciones migradas renderizan correctamente.
- `/pipeline`: se abrió un deal y se verificaron cierre, stepper y
  `Registrar avance`.
- `/actividades/nueva`: se abrió el formulario y se verificaron los toggles
  migrados.
- `/agenda`: se abrió `CreateTaskForm`, incluida la acción
  `Obtener sugerencias`; en Calendario se verificaron navegación y chips.
- `TaskChip` conserva `button`, `draggable="true"`, cursor `grab`, opacidad
  dinámica y click que abre `Editar tarea`.
- Consola del navegador: sin errores durante el recorrido autenticado.
- El usuario confirmó manualmente que el drag-and-drop mueve la tarea entre
  días. Con esa prueba física y la inspección independiente, el CHECKPOINT
  queda **PASSED 10/10**.

## Confirmación de alcance

No se modificaron `MiDiaPage.tsx`, tests, `button-variants.ts`, dependencias,
manifests, lockfiles, `feature_list.json` ni `CHECKPOINTS.md`. Estos dos últimos
ya tenían cambios preexistentes antes de iniciar el plan, junto con `.codex/`.
No se hizo commit, push, merge ni cambio de rama.
