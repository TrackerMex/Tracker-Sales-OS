# Exploración — feature 68-pipeline-client-coverage

Query source: `progress/audit_68-pipeline-client-coverage.sql`
Corrida contra: DB prod (`tracker-sales-os-trackersales-hibdzn`, database `sales-os`)
Seller de prueba: Fernanda Becerril — `id = 87228274-54a6-4f95-b41a-70d71ca76cd3`

## Resultado clave: definición de "cliente iniciado"

`stage <> 'Prospecto'` da 35 — **no reproduce** el 49 reportado.
`tiene_actividad` (existe row en `activities` para ese client+seller, no eliminada) da **49** — coincide exacto.
`con_deal` (Q2, deals visibles en pipeline) da **19** — coincide exacto con el otro lado del reporte.

Conclusión: `GET /pipeline/seller/:id` hoy solo cuenta clientes con `deals`. La definición real de "iniciado" que el negocio espera es "tiene actividad registrada", no el campo `stage`. Ese mismatch de definición es la causa raíz del 49 vs 19.

## Q8 — resumen por definición (seller Fernanda Becerril)

| métrica | valor |
|---|---|
| clientes_totales | 58 |
| stage_avanzado (`stage <> 'Prospecto'`) | 35 |
| con_siguiente_paso (`next_step`/`next_date`/`next_time`) | 0 |
| con_actividad | 49 |
| con_deal | 19 |
| iniciados_union (cualquier criterio) | 50 |
| iniciados_sin_deal | 31 |

## Hipótesis 1 (confirmada) — stage avanzado sin ningún deal

21 clientes con `stage <> 'Prospecto'` y ningún deal asociado. Coincide con `PATCH /clients/:id` moviendo `client.stage` sin crear deal — ver `ClientesPage.tsx` `handleStageChange`, rama `else` cuando `activeDeal` es null.

## Hipótesis 2 (descartada) — deal con seller desincronizado

0 rows. No hay deals cuyo `seller_id` difiera del `seller_id` actual del cliente para este seller.

## Q9 — clientes en Prospecto con actividad pero sin deal (10, no cubiertos por hipótesis 1)

Estos nunca cambiaron `stage` pero sí fueron trabajados (llamada/contacto registrado) y no generaron deal:

- Arrendadora Pura de México
- ARRENDADORA VE POR MAS
- BOEKI LOGISTICS
- Casanova Rent
- CHG-MERIDIAN MÉXICO
- MAS LEASING
- NEXU
- TEPER
- Trayecto
- VIANEY

21 (hipótesis 1) + 10 (Q9) = 31 = `iniciados_sin_deal` de Q8. Cuadra.

## Recomendación para el fix

1. Redefinir "cliente iniciado" en `GET /pipeline/seller/:id` (y donde se calcule el mismo metric) para incluir clientes con actividad registrada, no solo los que tienen deal — o crear deal automáticamente al registrar la primera actividad/cambio de stage.
2. Revisar `ClientesPage.tsx handleStageChange` rama `else` (activeDeal null) — hoy permite mover stage sin crear deal.
3. Regla elegida para el fix: "cliente iniciado" = cliente con al menos una actividad no eliminada del mismo seller. El backfill debe seleccionar directamente clientes que cumplen esa regla y no tienen ningún deal activo; el objetivo observable es pasar de 19 a 49 `clientId` distintos en el pipeline (30 faltantes bajo esta definición).
4. El valor 31 de `iniciados_sin_deal` pertenece a la unión `stage avanzado OR actividad` y contiene un cliente adicional que no necesariamente cumple la regla basada en actividad. No debe usarse como cantidad fija del backfill.
