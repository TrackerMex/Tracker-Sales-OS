# Auditoría de escalabilidad — 2026-07-07

Objetivo: evaluar qué tan viable es evolucionar Tracker Sales OS hacia un CRM profesional
con flexibilidad tipo Notion (campos/vistas configurables), manteniendo la idea actual
(disciplina comercial: puntos, calidad, semáforo, coaching IA).

## Evidencia revisada

- `feature_list.json` — 60 features done, historial completo de fixes y reviews
- `docs/architecture.md` — Clean Architecture, 11 tablas, RBAC, decisiones técnicas
- `backend/src/migrations/` — 6 migraciones, baseline reconciliada (feature 46), 17 índices
- `backend/package.json`, `frontend/package.json` — stack y deps
- Greps: tests, throttler, refresh tokens, CI, cache de settings, patrones findAll

## Estado actual — LOC y estructura

- Backend: ~8,700 LOC TS, 13 módulos, Clean Architecture consistente (domain/application/infrastructure/presentation)
- Frontend: ~16,300 LOC TS/TSX, 13 módulos espejo, shadcn/ui migrado completo (features 51-60)
- Prod real: VPS Hostinger + Dokploy, auto-deploy en main, migraciones auto en boot

## Fortalezas (base sólida)

1. **Clean Architecture disciplinada** — use-cases con interfaces de repo; cambiar infraestructura no toca dominio. Probado: 60 features sin reescrituras.
2. **Migraciones reconciliadas e idempotentes** (feature 46) + CLI TypeORM wired. Base de datos versionada correctamente.
3. **Authz endurecida** (feature 45): ownership derivado del JWT, no del body.
4. **Índices**: 17 en baseline; combobox de clientes ya es server-side paginado (feature 48).
5. **UI system consolidado**: shadcn + tokens tracker en todos los módulos — agregar pantallas nuevas es barato.
6. **LLM provider factory** intercambiable (openrouter/anthropic) con fallback.
7. **Auditoría y soft deletes** en todas las entidades.

## Debilidades por dimensión de escala

### A. Escala de carga (más datos/usuarios) — MEDIA
- `GetSettingsUseCase.cache` in-process → rompe con 2+ instancias del backend (horizontal scaling). Igual: invalidación solo local.
- Win/loss (`findAllForAnalysis`) carga TODOS los deals a memoria y calcula in-memory. OK hoy, muere con ~50k+ deals.
- Import/export carga la DB completa a JSON en memoria.
- `stage_history` JSONB con raw SQL (stalled deals) — sin índice GIN, full scan al crecer.
- Caveats de TZ conocidos: TO_CHAR usa TZ de sesión de DB vs Node local (leaderboard, cold accounts).
- Veredicto: aguanta sin cambios ~10-50k clientes/deals y decenas de usuarios concurrentes. Suficiente para 1 empresa mediana.

### B. Escala de producto (features nuevas) — ALTA
- Modular monolith bien cortado; el flujo Líder/Implementer/Reviewer ya produjo 60 features con reviews.
- Riesgo principal: reglas de negocio hardcodeadas (ver C).

### C. Escala hacia "CRM profesional configurable" — BAJA hoy, alcanzable
Todo el dominio comercial vive en constantes de código:
- 7 stages de pipeline + probabilities: enum hardcoded
- TASK_POINTS, tipos de actividad, fórmula de calidad (5 campos × 20%), fórmula de score (45/35/40/-10): constantes
- Un CRM profesional necesita esto por-organización y editable. La buena noticia: Clean Architecture concentra estas reglas en use-cases/constants — refactor a catálogos en DB es localizado, no reescritura.

### D. Escala SaaS multi-cliente — INEXISTENTE hoy
- Cero `tenant_id`/`org_id`. Users/sellers/clients/deals asumen 1 empresa.
- Convertir a SaaS = columna tenant en todas las tablas + scoping en todos los repos + índices compuestos tenant-first + onboarding. Factible pero es LA decisión estructural más cara; mientras más features se agreguen antes, más caro.

### E. Escala de equipo/calidad — RIESGO PRINCIPAL
- **3 archivos de test** para ~25k LOC (login, create-activity, app.controller).
- **Sin CI** (no .github/workflows) — el gate real es `tsc --noEmit` + review manual del Líder.
- Sin refresh tokens (JWT único en localStorage, sin revocación).
- Winston nunca se instaló (nota de feature 01 quedó pendiente) — logging = console default de Nest.
- Sin monitoreo/alertas en prod.

## ¿"Llegar a ser un Notion"?

Notion completo (bloques, bases de datos arbitrarias, colaboración realtime/CRDT) = otro producto,
otra arquitectura. NO recomendado como meta literal.

Meta realista que preserva la idea: **CRM flexible estilo Attio/Twenty** —
entidades CRM fijas (cliente, deal, actividad) + capa configurable encima:
- Custom fields por entidad (JSONB `custom_fields` + tabla `field_definitions`)
- Vistas guardadas por usuario (filtros/orden/columnas; ya existen tabla/kanban/calendario)
- Pipelines y scoring configurables por org
- Con eso se obtiene 80% del valor "Notion" sin abandonar el motor de disciplina comercial
  (puntos/calidad/semáforo) que es el diferenciador real del producto.

## Roadmap recomendado (orden importa)

### Fase 1 — Fundaciones (antes de crecer) — ~2-3 semanas de features
1. CI (GitHub Actions): tsc + lint + tests en PR
2. Tests de use-cases críticos (scoring, pipeline transitions, authz) + smoke e2e (qa-tester ya existe)
3. Refresh tokens + expiración corta de access token
4. Logging estructurado (pino o winston) + health/metrics
5. Backups automatizados de DB en prod (verificar Dokploy)

### Fase 2 — Configurabilidad (interna → CRM profesional) — ~4-6 semanas
6. Catálogos en DB: stages+probabilities, tipos de actividad+puntos, fórmulas de score parametrizadas (extender Settings existente)
7. Custom fields: `field_definitions` + JSONB en clients/deals + render dinámico en forms
8. Vistas guardadas (filtros/orden persistidos por usuario)
9. Notificaciones in-app (seguimientos vencidos, deals estancados)
10. Cache de settings con invalidación correcta (o TTL corto) — prerequisito de multi-instancia

### Fase 3 — Multi-tenancy (CRM propio → SaaS) — ~4-8 semanas
11. `org_id` en todas las tablas + scoping en repos + índices compuestos
12. Onboarding de organización, invitaciones, roles por org
13. Aislamiento: RLS de Postgres o scoping estricto en repos (decidir)
14. Billing (Stripe) cuando haya 2do cliente real

### Fase 4 — Capa "Notion-like" (solo si el producto lo pide)
15. Entidades custom definibles, relaciones dinámicas entre registros
16. Editor de notas rico en cliente/deal (bloques simples, no CRDT)
17. Automatizaciones (cuando deal entra a stage X → crear tarea Y)

## Veredicto

| Dimensión | Nota | Comentario |
|---|---|---|
| Base arquitectónica | 8/10 | Clean Architecture real, migraciones sanas |
| Escala de carga | 6/10 | OK 1 empresa mediana; cache in-process y analytics in-memory son los topes |
| Configurabilidad CRM | 3/10 | Todo hardcoded, pero refactor localizado |
| SaaS multi-tenant | 1/10 | No existe; decisión más cara, tomarla antes de la Fase 2 idealmente |
| Calidad/equipo | 3/10 | 3 tests, sin CI — riesgo #1 |

**Conclusión**: la base SÍ escala hacia CRM profesional — la arquitectura es el activo más fuerte
del proyecto. Los dos frenos reales no son técnicos-exóticos: (1) falta de tests+CI, (2) reglas
de negocio hardcodeadas. "Notion literal" no; "CRM flexible con motor de disciplina comercial"
(estilo Attio) sí, y es el posicionamiento más defendible de la idea actual.

**DECISIÓN (usuario, 2026-07-07): el producto SÍ se vende a otras empresas (SaaS).**
Roadmap reordenado: Fase 2 pasa a ser multi-tenancy; configurabilidad (catálogos,
custom fields, vistas) se construye después, ya sobre org_id — así nace multi-tenant
en vez de migrarse. Features 61-65 (Fase 1) y 66 (multi-tenancy, placeholder a partir
en sub-features) cargadas en feature_list.json como pending.
