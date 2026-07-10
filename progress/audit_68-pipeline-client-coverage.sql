-- ============================================================================
-- Auditoría READ-ONLY — feature 68-pipeline-client-coverage
-- Correr contra la DB real (prod o el ambiente donde se reportó el caso).
-- Ninguna query aquí modifica datos. Reemplaza :seller_id (o el nombre en Q0)
-- antes de correr las demás.
-- ============================================================================

-- Q0. Encontrar el seller_id del vendedor reportado (ajusta el ILIKE)
SELECT id, name
FROM sellers
WHERE name ILIKE '%NOMBRE_DEL_VENDEDOR%';

-- Pega el id de Q0 en :seller_id abajo (o reemplaza manualmente en cada query).

-- ============================================================================
-- Q1. Baseline — total de clientes "iniciados" del seller
-- (definición provisional: stage != 'Prospecto', no eliminados)
-- ============================================================================
SELECT count(*) AS clientes_iniciados
FROM clients
WHERE seller_id = :'seller_id'
  AND deleted_at IS NULL
  AND stage <> 'Prospecto';

-- ============================================================================
-- Q2. Baseline — clientId distintos con deal visible en el pipeline de este seller
-- (esto es lo que hoy devuelve GET /pipeline/seller/:id)
-- ============================================================================
SELECT count(DISTINCT client_id) AS client_ids_en_pipeline
FROM deals
WHERE seller_id = :'seller_id'
  AND deleted_at IS NULL;

-- Q1 vs Q2 debería reproducir el 49 vs 19 reportado. Si no, la definición de
-- "iniciado" es otra — ajustar Q1 (podría ser next_step/next_date no nulos
-- en vez de stage != 'Prospecto').

-- ============================================================================
-- HIPÓTESIS 1 (más probable): cliente con stage avanzado pero SIN ningún deal
-- (PATCH /clients/:id mueve client.stage sin crear deal — ver ClientesPage.tsx
-- handleStageChange, rama "else" cuando activeDeal es null)
-- ============================================================================
SELECT c.id, c.name, c.stage, c.next_step, c.next_date, c.updated_at
FROM clients c
LEFT JOIN deals d
  ON d.client_id = c.id AND d.deleted_at IS NULL
WHERE c.seller_id = :'seller_id'
  AND c.deleted_at IS NULL
  AND c.stage <> 'Prospecto'
  AND d.id IS NULL
ORDER BY c.updated_at DESC;

-- ============================================================================
-- HIPÓTESIS 2: cliente reasignado de seller DESPUÉS de que su deal ya existía
-- (deal.seller_id quedó con el valor viejo, PATCH /clients/:id no lo cascadea)
-- ============================================================================
SELECT d.id AS deal_id, d.client_id, c.name AS client_name,
       d.seller_id AS deal_seller_id, c.seller_id AS client_seller_id_actual,
       d.stage AS deal_stage, c.stage AS client_stage
FROM deals d
JOIN clients c ON c.id = d.client_id
WHERE d.deleted_at IS NULL
  AND c.deleted_at IS NULL
  AND d.seller_id <> c.seller_id
  AND (d.seller_id = :'seller_id' OR c.seller_id = :'seller_id');

-- ============================================================================
-- HIPÓTESIS 3: clientes creados YA con stage avanzado (nunca pasaron por
-- create-activity ni create-deal) — subconjunto de hipótesis 1, separado
-- para ver si el drift ocurre al alta o después por edición
-- ============================================================================
SELECT c.id, c.name, c.stage, c.created_at, c.updated_at,
       (c.created_at = c.updated_at) AS nunca_editado
FROM clients c
LEFT JOIN deals d ON d.client_id = c.id AND d.deleted_at IS NULL
WHERE c.seller_id = :'seller_id'
  AND c.deleted_at IS NULL
  AND c.stage <> 'Prospecto'
  AND d.id IS NULL
  AND c.created_at = c.updated_at;

-- ============================================================================
-- HIPÓTESIS 4: actividades registradas para el cliente sin stage informado
-- (nunca dispararon syncPipeline, cliente puede seguir sin deal)
-- ============================================================================
SELECT a.client_id, c.name, count(*) AS actividades_sin_stage,
       max(a.executed_at) AS ultima_actividad
FROM activities a
JOIN clients c ON c.id = a.client_id
LEFT JOIN deals d ON d.client_id = a.client_id AND d.deleted_at IS NULL
WHERE a.seller_id = :'seller_id'
  AND a.deleted_at IS NULL
  AND a.stage IS NULL
  AND d.id IS NULL
GROUP BY a.client_id, c.name;

-- ============================================================================
-- HIPÓTESIS 5 (menos probable, verificar igual): deals soft-deleted del seller
-- cuyo cliente sigue activo e "iniciado"
-- ============================================================================
SELECT d.id AS deal_id, d.client_id, c.name, d.stage, d.deleted_at
FROM deals d
JOIN clients c ON c.id = d.client_id
WHERE d.seller_id = :'seller_id'
  AND d.deleted_at IS NOT NULL
  AND c.deleted_at IS NULL
  AND c.stage <> 'Prospecto';

-- ============================================================================
-- Q7. Resumen ejecutivo — cuenta cuántos de los "iniciados" caen en cada bucket
-- ============================================================================
SELECT
  count(*) FILTER (WHERE d.id IS NOT NULL AND d.seller_id = c.seller_id) AS ok_con_deal_correcto,
  count(*) FILTER (WHERE d.id IS NULL) AS sin_ningun_deal,
  count(*) FILTER (WHERE d.id IS NOT NULL AND d.seller_id <> c.seller_id) AS deal_con_seller_desincronizado
FROM clients c
LEFT JOIN LATERAL (
  SELECT * FROM deals dd
  WHERE dd.client_id = c.id AND dd.deleted_at IS NULL
  ORDER BY dd.created_at DESC LIMIT 1
) d ON true
WHERE c.seller_id = :'seller_id'
  AND c.deleted_at IS NULL
  AND c.stage <> 'Prospecto';

-- ============================================================================
-- Q8. Comparar definiciones posibles de "cliente iniciado"
-- Ejecutar antes del fix para decidir el alcance exacto del backfill.
-- Cuenta client_id distintos y evita inflar resultados por varias actividades
-- u oportunidades del mismo cliente.
-- ============================================================================
WITH client_flags AS (
  SELECT
    c.id,
    c.stage,
    (NULLIF(BTRIM(c.next_step), '') IS NOT NULL
      OR c.next_date IS NOT NULL
      OR c.next_time IS NOT NULL) AS tiene_siguiente_paso,
    EXISTS (
      SELECT 1
      FROM activities a
      WHERE a.client_id = c.id
        AND a.seller_id = c.seller_id
        AND a.deleted_at IS NULL
    ) AS tiene_actividad,
    EXISTS (
      SELECT 1
      FROM deals d
      WHERE d.client_id = c.id
        AND d.seller_id = c.seller_id
        AND d.deleted_at IS NULL
    ) AS tiene_deal
  FROM clients c
  WHERE c.seller_id = :'seller_id'
    AND c.deleted_at IS NULL
)
SELECT
  count(*) AS clientes_totales,
  count(*) FILTER (WHERE stage <> 'Prospecto') AS stage_avanzado,
  count(*) FILTER (WHERE tiene_siguiente_paso) AS con_siguiente_paso,
  count(*) FILTER (WHERE tiene_actividad) AS con_actividad,
  count(*) FILTER (WHERE tiene_deal) AS con_deal,
  count(*) FILTER (
    WHERE stage <> 'Prospecto'
       OR tiene_siguiente_paso
       OR tiene_actividad
       OR tiene_deal
  ) AS iniciados_union,
  count(*) FILTER (
    WHERE (stage <> 'Prospecto'
       OR tiene_siguiente_paso
       OR tiene_actividad)
      AND NOT tiene_deal
  ) AS iniciados_sin_deal
FROM client_flags;

-- Q9. Detalle de los clientes que solo entran por actividad/siguiente paso,
-- pero siguen en Prospecto y no tienen deal. Sirve para revisar si deben formar
-- parte del pipeline antes de fijar la regla definitiva.
WITH client_flags AS (
  SELECT
    c.id,
    c.name,
    c.stage,
    c.next_step,
    c.next_date,
    c.next_time,
    EXISTS (
      SELECT 1
      FROM activities a
      WHERE a.client_id = c.id
        AND a.seller_id = c.seller_id
        AND a.deleted_at IS NULL
    ) AS tiene_actividad,
    EXISTS (
      SELECT 1
      FROM deals d
      WHERE d.client_id = c.id
        AND d.seller_id = c.seller_id
        AND d.deleted_at IS NULL
    ) AS tiene_deal
  FROM clients c
  WHERE c.seller_id = :'seller_id'
    AND c.deleted_at IS NULL
)
SELECT id, name, stage, next_step, next_date, next_time, tiene_actividad
FROM client_flags
WHERE stage = 'Prospecto'
  AND NOT tiene_deal
  AND (
    tiene_actividad
    OR NULLIF(BTRIM(next_step), '') IS NOT NULL
    OR next_date IS NOT NULL
    OR next_time IS NOT NULL
  )
ORDER BY name;
