# Plan de Mejoras — Inspirado en SalesOS (docs.salesos.org)

**Fecha**: 2026-06-11
**Alcance**: Solo mejorar lo existente. Sin integraciones nuevas (sin webhooks, sin email sequences, sin third-party). Todas las mejoras usan datos y módulos que ya tenemos.

---

## Contexto

SalesOS es un CRM de ventas con IA. Sus pilares: revenue intelligence (deal scoring, forecast, detección de fugas), coaching con IA, gamificación/leaderboards, y data quality. Tracker Sales OS ya cubre el core (pipeline, actividades, scoring de vendedores, coaching, IA coach) — las mejoras abajo son la capa de *inteligencia* que SalesOS pone encima de los mismos datos.

Estado actual: 17/17 features done. QA smoke 2026-06-09 = GO. Bugs menores 3/4/5 corregidos en commits recientes (logout redirect, sidebar RBAC, Facebook enum, UUIDs del seed).

---

## Fase 1 — Quick wins (datos ya existen, solo calcular y mostrar)

### 1.1 Forecast ponderado del pipeline
**Idea SalesOS**: "Forecast Intelligence — beyond weighted pipeline".
**Nuestra versión**: ya tenemos `probability` por stage. Calcular `SUM(amount × probability)` y mostrarlo:
- Header del Kanban: "Forecast ponderado: $X" junto al total bruto.
- Dashboard: tarjeta "Forecast del mes" comparada vs `monthlyAmountGoal` de Settings.
- Módulos: `pipeline` (backend query + frontend header), `dashboard`.

### 1.2 Detección de deals estancados (revenue leakage)
**Idea SalesOS**: "Identify stalled deals, at-risk revenue with alerts".
**Nuestra versión**: `stage_history` JSONB ya guarda timestamps. Calcular días en stage actual:
- Badge ámbar/rojo en tarjeta Kanban si >7/>14 días sin moverse (umbrales configurables en Settings).
- Lista "Deals en riesgo" en dashboard para Director/Admin.
- Módulos: `pipeline`, `dashboard`, `settings` (2 campos nuevos opcionales).

### 1.3 Leaderboard mensual (gamificación)
**Idea SalesOS**: "Gamification & Leaderboards".
**Nuestra versión**: ya calculamos score/puntos/calidad por vendedor. Agregar vista ranking:
- Tab o sección en Dashboard: ranking del mes por puntos, con posición, delta vs mes anterior y racha de días cumpliendo `dailyMinPoints`.
- Solo lectura, derivado de `activities`. Sin tablas nuevas.
- Módulos: `dashboard`.

### 1.4 Indicador visual de tareas vencidas
Pendiente conocido (nota en feature 06): tareas con `scheduledAt` pasado sin completar → badge rojo en Agenda y Mi Día.
- Módulos: `tasks`, `mi-dia`.

---

## Fase 2 — Mejoras de inteligencia (cálculo nuevo sobre datos existentes)

### 2.1 Cuentas frías (data freshness)
**Idea SalesOS**: "Data Quality & Freshness".
**Nuestra versión**: cliente sin actividad en N días = "cuenta fría":
- Columna/badge "última actividad" en lista de clientes, filtro "sin contacto >14 días".
- Alerta en Mi Día: "3 cuentas frías asignadas a ti".
- Módulos: `clients` (query join con activities), `mi-dia`.

### 2.2 Score de calidad de datos por cliente
**Idea SalesOS**: data quality scoring.
**Nuestra versión**: mismo patrón que calidad de actividad (5 campos × 20%): % de campos llenos del cliente/contactos (tel, email, dominio, tipo persona, fuente). Badge en detalle de cliente + filtro "datos incompletos".
- Módulos: `clients`.

### 2.3 Análisis win/loss y conversión por etapa
**Idea SalesOS**: "Win/Loss Intelligence".
**Nuestra versión**: con `stage_history` calcular:
- Tasa de conversión etapa→etapa (funnel) y tiempo promedio por etapa.
- % perdidos por etapa de origen (¿dónde se mueren los deals?).
- Nueva sección en Reports (solo Admin/Director). Opcional: campo `lossReason` al mover a Perdido (select simple: precio, competencia, sin respuesta, timing, otro).
- Módulos: `pipeline` (campo opcional), `reports`.

### 2.4 IA Coach con más contexto
**Idea SalesOS**: AI coaching + objection playbook.
**Nuestra versión**: enriquecer el prompt de `POST /api/coaching/suggestion` con datos que ya están en DB:
- Últimas 3 actividades del cliente, días en stage actual, calidad promedio del vendedor.
- Si el deal está estancado (2.1), el tip lo menciona explícitamente.
- Mismo endpoint, mismo proveedor — solo mejor prompt.
- Módulos: `coaching`.

---

## Fase 3 — Deuda técnica y robustez

| # | Item | Origen | Acción |
|---|------|--------|--------|
| 3.1 | AuditInterceptor sin verificar | bugs.md #3 | Verificar si `audit_logs` se puebla en cambios de stage; implementar si falta |
| 3.2 | `dailyCallsGoal` hardcoded (10) | bug #1 fix parcial | Agregar a Settings como los demás goals |
| 3.3 | 403s en consola con rol Seller | qa_smoke bug 5 | Verificar que tras el fix de sidebar RBAC el frontend ya no llame endpoints admin-only |
| 3.4 | Feedback de error en formularios | qa_smoke bug 2 | Verificar que `impl_error_feedback.md` cubrió todos los forms (clientes, ventas, tareas) |
| 3.5 | Tests E2E reproducibles | feature 17 | Re-correr seed corregido + smoke con qa-tester para validar fixes recientes |

---

## Orden recomendado

1. **Fase 3 primero** (3.3–3.5): verificar que los fixes recientes quedaron completos antes de construir encima.
2. **Fase 1** (1.1 → 1.4): máximo valor visible por esfuerzo, sin tablas nuevas.
3. **Fase 2** (2.1 → 2.4): inteligencia derivada; 2.3 es la más grande (única que toca schema con campo opcional).

Cada item sigue el flujo Harness: explore → implement → review → checkpoint, una feature a la vez. Agregar a `feature_list.json` como features 18+ cuando se aprueben.

## Descartado explícitamente (fuera de alcance)

- Webhooks/eventos en tiempo real, integraciones third-party, email sequences, CPQ/quotes, enriquecimiento externo de datos, roleplay con IA, multi-touch attribution — todo requiere integraciones o módulos nuevos.
