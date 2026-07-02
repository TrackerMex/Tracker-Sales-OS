# QA REPORT — 2026-07-02 — Fix sync client.stage <-> deal.stage

## Entorno
- Commit: a580ba9 (branch fix/auth-tasks-activities)
- Servicios: postgres (healthy), backend :3000, frontend Vite :3001, nginx :80 — todos UP
- Herramienta: Playwright (Chromium headless) — el MCP de Playwright no estaba disponible en la sesión; se usó la librería vía Node
- Usuario de prueba: **admin / Admin123!** (los usuarios del seed seller1/director1 NO existen en la DB actual; el seed `progress/seed_test_users.sql` falla por drift de schema — `sellers` ya no tiene columna `email` — por lo que no se pudo probar con rol Seller)
- Datos de prueba: cliente "Codex" (seller Alexis) con 1 deal; estado inicial con drift real: `clients.stage=Interesado`, `deals.stage=Contactado`

## HALLAZGO CRÍTICO DE ENTORNO (bloqueó la primera corrida)

**El hot reload de Docker NO aplicó el fix en ninguno de los dos servicios:**

1. **Frontend**: Vite servía una transformación STALE de `ClientesPage.tsx` (sin `useClientDeals` ni `ALLOWED_TRANSITIONS`) aunque el archivo dentro del contenedor ya tenía el código nuevo. Verificado con `curl http://localhost:3001/src/modules/clients/presentation/pages/ClientesPage.tsx` → 0 matches del código nuevo antes del restart.
2. **Backend**: `nest start --watch` nunca recompiló; `/app/dist/modules/pipeline/application/use-cases/change-deal-stage.use-case.js` NO contenía `CLIENT_REPOSITORY` mientras el `.ts` fuente sí. El proceso corría el dist viejo → el sync deal→client no se ejecutaba (verificado en DB: deal en Negociación, client seguía Interesado).

**Remedio aplicado**: `docker restart tracker-sales-ui` y `docker restart tracker-sales-api`. Tras el restart, todo el fix funciona (ver resultados). **Riesgo para futuras sesiones**: el file-watching de volúmenes Windows→Docker no dispara recompilación; después de cada cambio de código hay que reiniciar los contenedores o habilitar polling (CHOKIDAR_USEPOLLING / `nest --watch` con polling).

## Resultados por escenario (post-restart, corrida limpia)

### Escenario 1 — Clientes → Pipeline: **PASS**
- Deal Codex en columna **Contactado** del Kanban; tag del cliente con drift previo (Interesado).
- En detalle del cliente, el botón activo (fondo #002B49) fue **Contactado** = stage del DEAL, no el tag drifteado del cliente. Evidencia: `progress/screenshots/qa_stage_sync/02_client_detail_buttons.png`
- Habilitados exactamente **Interesado** y **Perdido**; Prospecto/Contactado/Propuesta/Negociación/Cierre disabled con opacity-40.
- Click en Interesado → `PATCH /api/deals/b220d992.../stage` 200 → toast "Stage actualizado" (`04_after_click_interesado.png`).
- Navegación in-app (sin reload) a Pipeline → deal Codex en columna **Interesado** (invalidation de TanStack Query OK). Evidencia: `05_pipeline_after_client_change.png`

### Escenario 2 — Pipeline → Clientes: **PASS**
- Stepper del slide-over (click en deal): Interesado→Propuesta OK (200); Kanban movió el deal a Propuesta (`08_pipeline_after_stepper.png`).
- Drag & drop del Kanban: Propuesta→Negociación OK, toast "Movido a Negociación".
- Sync deal→client verificado con la corrida P2 (Negociación→Cierre vía stepper):
  - tag del cliente en la lista pasó a **Cierre** sin recargar (`18_clientes_list_cierre.png`)
  - tag en detalle **Cierre** (`19_client_detail_cierre.png`)
  - DB: `clients.stage=Cierre` = `deals.stage=Cierre` ✔
- Nota: en la primera corrida post-restart-frontend los checks de tag fallaron porque el BACKEND aún corría el dist viejo (ver hallazgo crítico). Con backend recompilado, todo PASS.

### Escenario 3 — Cliente sin deal: **PASS**
- Creado "QA SinDeal E2E" (toast "Cliente creado").
- En su detalle los 7 botones habilitados (`13_nodeal_buttons.png`).
- Click en Negociación (salto directo) → toast "Stage actualizado", tag = Negociación, request fue `PATCH /api/clients/:id` (0 requests a `/stage`) (`14_nodeal_after_click.png`).
- El Kanban NO muestra al cliente (sin deal fantasma) (`15_pipeline_no_ghost_deal.png`).

### Escenario 4 — Transición inválida bloqueada: **PASS**
- Con deal en Contactado, botón "Cierre" con `disabled=true`; click forzado (force:true) NO disparó ningún request a `/stage` (contador de requests 0→0). Evidencia: `03_invalid_transition_blocked.png`

### Escenario 5 — Regresión stepper de PipelinePage: **PASS**
- El stepper del detalle del deal sigue funcionando (2 movimientos: Interesado→Propuesta y Negociación→Cierre, ambos 200) y ahora sí actualiza el tag del cliente en tab Clientes (verificado en P2c/P2d).
- Con deal en Cierre (terminal), el card de Clientes deshabilita TODOS los botones incluido Perdido — coincide con `ALLOWED_TRANSITIONS.Cierre = []` del código (espejo del backend).

## Consola y red
- Corrida final: **0 errores de consola, 0 responses >= 400**.
- Requests observados: `PATCH /api/deals/:id/stage` (con deal), `PATCH /api/clients/:id` (sin deal) — correcto según diseño.

## Observaciones / bugs menores NUEVOS (no bloquean el fix)

1. **[Media] Seed roto por drift de schema**: `progress/seed_test_users.sql` falla (`column "email" does not exist` en `sellers`) → no se pueden crear los usuarios de prueba seller1/director1/admin del seed. Impide probar RBAC/rol Seller. Sospechoso: migración baseline reciente (commit 8710750) vs seed desactualizado.
2. **[Baja] Stepper del slide-over sin guard de transiciones**: `ClientDetailPage.tsx` (pipeline) permite clickear cualquier dot no-actual; un salto inválido dispara `PATCH /stage` que devuelve **400 y falla en silencio** (el `handleStageChange` del stepper no tiene onError/toast). Reproducido en la corrida 1 (2x 400 sin feedback al usuario). El card de Clientes sí tiene el guard; el stepper no.
3. **[Info] Stale UI en slide-over**: tras mover stage desde el stepper, el propio stepper muestra el stage viejo hasta cerrar/reabrir (el `selectedDeal` en estado local no se refresca con la invalidation). Cosmético.

## Estado de datos al terminar
- Codex: client.stage = deal.stage = **Cierre** (consistente; el drift previo quedó resuelto).
- Cliente de prueba "QA SinDeal E2E" (stage Negociación, sin deal) quedó en la DB — eliminar si estorba.

## Veredicto
**PASS (con nota de entorno)** — El fix funciona correcto en ambas direcciones una vez que el código realmente corre: los 5 escenarios PASS. El único riesgo real es operativo: el hot reload en Docker no aplica cambios (frontend y backend); sin reiniciar contenedores se estaría demo-ando código viejo.
