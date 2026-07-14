# Implementación — 62-critical-use-case-tests

## Alcance

Se agregaron pruebas unitarias de casos de uso críticos sin modificar código de producción, dependencias ni los specs existentes de pipeline y actividades.

## Archivos creados

- `backend/src/modules/dashboard/application/use-cases/get-sellers-score.use-case.spec.ts`
- `backend/src/modules/tasks/application/use-cases/create-task.use-case.spec.ts`
- `backend/src/modules/tasks/application/use-cases/update-task.use-case.spec.ts`
- `backend/src/modules/clients/application/use-cases/create-client.use-case.spec.ts`

## Casos agregados

### Dashboard scoring

- Semáforo rojo para score 44, ámbar para 45 y verde para 75.
- Ausencia de actividad produce score 0 y semáforo rojo.
- Clamp superior a 100.
- Penalización de 10 puntos por tarea vencida y clamp inferior a 0.
- Dobles unitarios mínimos para los repositorios TypeORM, sin conexión a DB.

### Tareas

- Creación de tarea pendiente cuando no existe conflicto.
- Rechazo con `ConflictException` cuando el horario se solapa.
- Reprogramación consulta conflictos excluyendo el id de la propia tarea.
- Rechazo de reprogramación cuando existe otra tarea conflictiva.
- Seller no puede editar tareas de otro seller.
- Admin y Director pueden editar sin ownership de seller.

### Clientes

- Seller usa siempre el `sellerId` autenticado e ignora el enviado en payload.
- Admin y Director usan el `sellerId` seleccionado en payload.
- Rechazo de Seller sin seller asociado y de Admin/Director sin seller seleccionado.
- Anti-duplicados por nombre de empresa o dominio.
- Anti-duplicados de contactos existentes por teléfono o email.
- Anti-duplicados dentro del payload normalizando formato de teléfono y mayúsculas/espacios de email.

### Cobertura preexistente conservada

- `change-deal-stage.use-case.spec.ts` ya cubría mapa de transiciones libres, rechazo de misma fase, reapertura desde `Cierre`/`Perdido`, probabilidad, historial y sincronización del cliente; no se modificó.
- `create-activity.use-case.spec.ts` ya cubría `TASK_POINTS`, calidad 0/40/100 y validación de siguiente paso, además de sincronización transaccional del pipeline; no se modificó.

## Verificación

Ejecutado desde `backend/`:

- `npx jest --runInBand src/modules/dashboard/application/use-cases/get-sellers-score.use-case.spec.ts src/modules/tasks/application/use-cases/create-task.use-case.spec.ts src/modules/tasks/application/use-cases/update-task.use-case.spec.ts src/modules/clients/application/use-cases/create-client.use-case.spec.ts`
  - PASS: 4 suites, 25 tests, 0 snapshots.
- `npx prettier --write src/modules/dashboard/application/use-cases/get-sellers-score.use-case.spec.ts src/modules/tasks/application/use-cases/create-task.use-case.spec.ts src/modules/tasks/application/use-cases/update-task.use-case.spec.ts src/modules/clients/application/use-cases/create-client.use-case.spec.ts`
  - PASS: 4 archivos formateados.
- `npx tsc --noEmit`
  - PASS: exit code 0, sin errores TypeScript.
- `npx jest --runInBand`
  - PASS: 11 suites, 60 tests, 0 snapshots; tiempo reportado 6.03 s.

Los comandos npm sólo emitieron warnings no bloqueantes por las opciones heredadas `node-linker` y `shamefully-hoist`.

## Corrección post-review — lint de backend

### Causa

- Las aserciones de Jest recibían métodos de los repositorios mock como valores separados de su objeto, lo que activaba `@typescript-eslint/unbound-method`.
- Los factories de repositorios mock aplicaban conversiones de tipo redundantes, detectadas por `@typescript-eslint/no-unnecessary-type-assertion`.

### Corrección

- Se conservaron los mismos casos, cobertura y aserciones semánticas, consultando las llamadas mediante `mock.calls` para mantener los métodos ligados al repositorio.
- Se eliminaron las tres conversiones de tipo innecesarias; los factories siguen validados por su tipo de retorno `jest.Mocked<IClientRepository>` o `jest.Mocked<ITaskRepository>`.
- No se modificaron reglas ESLint, código de producción, dependencias ni otros tests.

### Verificación completa

Ejecutado desde `backend/`:

- `npx eslint "{src,apps,libs,test}/**/*.ts"`
  - PASS: exit code 0, sin errores ni warnings de ESLint; tiempo reportado 17.9 s.
- `npx jest --runInBand`
  - PASS: 11 suites, 60 tests, 0 snapshots; tiempo de Jest reportado 9.946 s.
- `npx tsc --noEmit`
  - PASS: exit code 0, sin errores TypeScript; tiempo reportado 8 s.

`npm` mantuvo únicamente sus dos warnings no bloqueantes de configuración heredada por `node-linker` y `shamefully-hoist`.
