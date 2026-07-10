# Implementacion 69-pipeline-free-stage

## Cambios

- Backend: `ALLOWED_TRANSITIONS` ahora permite cambiar desde cualquiera de las siete fases hacia las otras seis. La fase actual permanece excluida; `Cierre` y `Perdido` son reabribles.
- Frontend: el mirror de `ALLOWED_TRANSITIONS` quedo identico al mapa del backend.
- Tests: se agrego cobertura automatizada del mapa completo, salto no adyacente (`Prospecto -> Negociacion`), salida desde `Cierre`, salida desde `Perdido` y rechazo de la misma fase.
- El use-case existente sigue siendo responsable de `stageHistory`, `changedBy`, probabilidad, sincronizacion con cliente y `lossReason` opcional solo al entrar en `Perdido`; no fue necesario modificarlo.

## Verificacion

- `cd backend && npx jest src/modules/pipeline/application/use-cases/change-deal-stage.use-case.spec.ts --runInBand`
  - PASS: 1 suite, 5 tests.
- `cd backend && npx tsc --noEmit`
  - PASS: sin errores TypeScript.
- `cd frontend && npx tsc --noEmit`
  - PASS: sin errores TypeScript.

Los comandos `npx` mostraron unicamente warnings de npm sobre las opciones de proyecto `node-linker` y `shamefully-hoist`; no se instalaron dependencias ni se modifico ningun lockfile.
