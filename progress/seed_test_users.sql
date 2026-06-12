-- ============================================================
-- Tracker Sales OS — Seed Test Users
-- Fecha: 2026-06-11 (UUIDs corregidos a v4 válidos)
-- Objetivo: Crear usuarios y datos de prueba para testing manual E2E
-- ============================================================

-- NOTA: Ejecutar como:
-- docker exec -i tracker-sales-db psql -U tracker -d tracker_sales_os < progress/seed_test_users.sql

-- UUID Map:
-- seller1  (Juan Pérez)          : a1b2c3d4-0000-4000-8000-000000000001
-- seller2  (María López)         : a1b2c3d4-0000-4000-8000-000000000002
-- user     director1             : a1b2c3d4-0000-4000-8000-000000000003
-- user     seller1               : a1b2c3d4-0000-4000-8000-000000000004
-- user     seller2               : a1b2c3d4-0000-4000-8000-000000000005
-- client   Empresa ABC           : a1b2c3d4-0000-4000-8000-000000000010
-- contact  Roberto García        : a1b2c3d4-0000-4000-8000-000000000011
-- task     Llamar a Roberto      : a1b2c3d4-0000-4000-8000-000000000020
-- task     Cotización urgente    : a1b2c3d4-0000-4000-8000-000000000021
-- task     Reunión mañana        : a1b2c3d4-0000-4000-8000-000000000022
-- activity Llamada               : a1b2c3d4-0000-4000-8000-000000000030
-- activity Reunión presencial    : a1b2c3d4-0000-4000-8000-000000000031
-- activity Chat/WA               : a1b2c3d4-0000-4000-8000-000000000032
-- deal     Implementación Tracker: a1b2c3d4-0000-4000-8000-000000000040
-- sale     Plan Enterprise       : a1b2c3d4-0000-4000-8000-000000000050
-- settings app_settings          : a1b2c3d4-0000-4000-8000-000000000060

-- ============================================================
-- 1. Crear Sellers
-- ============================================================

-- Seller 1: Juan Pérez
INSERT INTO sellers (id, name, email, phone, active, created_at, updated_at)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000001',
  'Juan Pérez',
  'juan@trackersales.com',
  '+52 55 1234 5678',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Seller 2: María López
INSERT INTO sellers (id, name, email, phone, active, created_at, updated_at)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000002',
  'María López',
  'maria@trackersales.com',
  '+52 55 8765 4321',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Crear Users
-- ============================================================

-- User Director1
INSERT INTO users (id, username, password, role, active, seller_id, created_at, updated_at)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000003',
  'director1',
  '$2b$10$8H7uzfFa5.MMkSbHnG8W5ehLdBfY8b8yFn3k.s.KeROkUzwGHVDDu',  -- Director123!
  'Director',
  true,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- User Seller1 (vinculado a Juan Pérez)
INSERT INTO users (id, username, password, role, active, seller_id, created_at, updated_at)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000004',
  'seller1',
  '$2b$10$OhIzvEdBDtVEWVoXHL//jOPUhyEDyk37yE34Ra3.vY5B689Y6Dj9q',  -- Seller123!
  'Seller',
  true,
  'a1b2c3d4-0000-4000-8000-000000000001',
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- User Seller2 (vinculado a María López)
INSERT INTO users (id, username, password, role, active, seller_id, created_at, updated_at)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000005',
  'seller2',
  '$2b$10$OhIzvEdBDtVEWVoXHL//jOPUhyEDyk37yE34Ra3.vY5B689Y6Dj9q',  -- Seller123!
  'Seller',
  true,
  'a1b2c3d4-0000-4000-8000-000000000002',
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 3. Crear Cliente de Prueba (para seller1)
-- ============================================================

INSERT INTO clients (
  id,
  name,
  type,
  stage,
  next_step,
  next_date,
  next_time,
  seller_id,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000010',
  'Empresa ABC S.A. de C.V.',
  'Moral',
  'Prospecto',
  'Enviar propuesta comercial',
  '2026-06-10',
  '10:00',
  'a1b2c3d4-0000-4000-8000-000000000001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Contacto del cliente
INSERT INTO contacts (
  id,
  client_id,
  name,
  email,
  phone,
  position,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000011',
  'a1b2c3d4-0000-4000-8000-000000000010',
  'Roberto García',
  'roberto@abc.com',
  '+52 55 1111 2222',
  'Director General',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Crear Tareas de Prueba (para seller1)
-- ============================================================

-- Tarea para HOY (pendiente)
INSERT INTO tasks (
  id,
  title,
  description,
  type,
  scheduled_at,
  completed,
  client_id,
  seller_id,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000020',
  'Llamar a Roberto García',
  'Seguimiento propuesta comercial',
  'Llamada',
  '2026-06-09T10:00:00Z',
  false,
  'a1b2c3d4-0000-4000-8000-000000000010',
  'a1b2c3d4-0000-4000-8000-000000000001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Tarea VENCIDA (ayer)
INSERT INTO tasks (
  id,
  title,
  description,
  type,
  scheduled_at,
  completed,
  client_id,
  seller_id,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000021',
  'Enviar cotización urgente',
  'Cliente solicitó cotización servicios',
  'Correo',
  '2026-06-08T14:00:00Z',
  false,
  'a1b2c3d4-0000-4000-8000-000000000010',
  'a1b2c3d4-0000-4000-8000-000000000001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Tarea para MAÑANA
INSERT INTO tasks (
  id,
  title,
  description,
  type,
  scheduled_at,
  completed,
  client_id,
  seller_id,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000022',
  'Reunión presencial oficinas ABC',
  'Presentación propuesta final',
  'Reunión presencial',
  '2026-06-10T11:00:00Z',
  false,
  'a1b2c3d4-0000-4000-8000-000000000010',
  'a1b2c3d4-0000-4000-8000-000000000001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Crear Actividades de Prueba (para seller1)
-- ============================================================

-- Actividad HOY — Llamada (3 puntos, calidad 100%)
INSERT INTO activities (
  id,
  type,
  objective,
  summary,
  discovery,
  agreement,
  next_step,
  next_date,
  next_time,
  quality,
  delay_minutes,
  client_id,
  seller_id,
  captured_at,
  executed_at,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000030',
  'Llamada',
  'Dar seguimiento a propuesta enviada',
  'Cliente revisó propuesta y tiene dudas sobre implementación y tiempos',
  'Requiere capacitación para equipo de ventas existente',
  'Enviar plan de capacitación detallado en 48 horas máximo',
  'Enviar documento de capacitación',
  '2026-06-11',
  '10:00',
  100,
  15,
  'a1b2c3d4-0000-4000-8000-000000000010',
  'a1b2c3d4-0000-4000-8000-000000000001',
  '2026-06-09T09:45:00Z',
  '2026-06-09T09:30:00Z',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Actividad HOY — Visita (10 puntos, calidad 100%)
INSERT INTO activities (
  id,
  type,
  objective,
  summary,
  discovery,
  agreement,
  next_step,
  next_date,
  next_time,
  quality,
  delay_minutes,
  client_id,
  seller_id,
  captured_at,
  executed_at,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000031',
  'Reunión presencial',
  'Presentación de propuesta comercial completa',
  'Reunión con Director General y equipo de compras de 3 personas, bien recibida',
  'Presupuesto aprobado internamente, decisión final en 2 semanas por comité',
  'Enviar contrato preliminar con términos y condiciones actualizados',
  'Seguimiento telefónico en 1 semana',
  '2026-06-16',
  '11:00',
  100,
  30,
  'a1b2c3d4-0000-4000-8000-000000000010',
  'a1b2c3d4-0000-4000-8000-000000000001',
  '2026-06-09T14:30:00Z',
  '2026-06-09T14:00:00Z',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Actividad ayer — Chat (1 punto, calidad 60%)
INSERT INTO activities (
  id,
  type,
  objective,
  summary,
  discovery,
  agreement,
  next_step,
  next_date,
  next_time,
  quality,
  delay_minutes,
  client_id,
  seller_id,
  captured_at,
  executed_at,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000032',
  'Chat/WA',
  'Consulta sobre servicios',
  'Cliente preguntó por disponibilidad y precios básicos',
  'Interesado en plan enterprise',
  NULL,
  'Enviar propuesta',
  '2026-06-09',
  NULL,
  60,
  5,
  'a1b2c3d4-0000-4000-8000-000000000010',
  'a1b2c3d4-0000-4000-8000-000000000001',
  '2026-06-08T16:05:00Z',
  '2026-06-08T16:00:00Z',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. Crear Deal en Pipeline (para seller1)
-- ============================================================

INSERT INTO deals (
  id,
  title,
  description,
  amount,
  stage,
  probability,
  stage_history,
  client_id,
  seller_id,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000040',
  'Implementación Tracker Sales OS',
  'Sistema CRM para equipo de 5 vendedores con capacitación incluida',
  150000.00,
  'Propuesta',
  50,
  '[{"stage":"Prospecto","changedAt":"2026-06-05T10:00:00Z"},{"stage":"Contactado","changedAt":"2026-06-06T14:00:00Z"},{"stage":"Interesado","changedAt":"2026-06-07T11:00:00Z"},{"stage":"Propuesta","changedAt":"2026-06-09T09:00:00Z"}]'::jsonb,
  'a1b2c3d4-0000-4000-8000-000000000010',
  'a1b2c3d4-0000-4000-8000-000000000001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. Crear Venta de Prueba (para seller1)
-- ============================================================

INSERT INTO sales (
  id,
  type,
  client_type,
  product,
  units,
  amount,
  payment_method,
  origin,
  closed_at,
  seller_id,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000050',
  'Seller',
  'Nuevo',
  'Tracker Sales OS - Plan Enterprise',
  5,
  180000.00,
  'Pagado',
  'Prospección propia',
  '2026-06-05',
  'a1b2c3d4-0000-4000-8000-000000000001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. Crear Settings iniciales (si no existen)
-- ============================================================

INSERT INTO settings (id, key, value, created_at, updated_at)
VALUES (
  'a1b2c3d4-0000-4000-8000-000000000060',
  'app_settings',
  '{"dailyMinPoints":30,"monthlyAmountGoal":600000,"monthlyUnitGoal":150,"sellerMonthlyAmountGoal":150000}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

-- Verificar datos insertados
SELECT 'Sellers creados:' as status, COUNT(*) as count FROM sellers;
SELECT 'Users creados:' as status, COUNT(*) as count FROM users;
SELECT 'Clients creados:' as status, COUNT(*) as count FROM clients;
SELECT 'Tasks creadas:' as status, COUNT(*) as count FROM tasks;
SELECT 'Activities creadas:' as status, COUNT(*) as count FROM activities;
SELECT 'Deals creados:' as status, COUNT(*) as count FROM deals;
SELECT 'Sales creadas:' as status, COUNT(*) as count FROM sales;
