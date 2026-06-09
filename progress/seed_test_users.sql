-- ============================================================
-- Tracker Sales OS — Seed Test Users
-- Fecha: 2026-06-09
-- Objetivo: Crear usuarios y datos de prueba para testing manual E2E
-- ============================================================

-- NOTA: Ejecutar como:
-- docker exec -i tracker-sales-db psql -U tracker -d tracker_sales_os < progress/seed_test_users.sql

-- ============================================================
-- 1. Crear Sellers
-- ============================================================

-- Seller 1: Juan Pérez
INSERT INTO sellers (id, name, email, phone, active, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
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
  '22222222-2222-2222-2222-222222222222',
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

-- Password hash para "admin123" (bcrypt rounds=10)
-- Generado con: bcrypt.hash('admin123', 10)
-- NOTA: En producción, generar hash real con bcrypt

-- User Admin (ya existe, skip)
-- INSERT INTO users (id, username, password, role, active, created_at, updated_at)
-- VALUES (...)

-- User Director1
INSERT INTO users (id, username, password, role, active, seller_id, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
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
  '44444444-4444-4444-4444-444444444444',
  'seller1',
  '$2b$10$OhIzvEdBDtVEWVoXHL//jOPUhyEDyk37yE34Ra3.vY5B689Y6Dj9q',  -- Seller123!
  'Seller',
  true,
  '11111111-1111-1111-1111-111111111111',  -- seller_id: Juan Pérez
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- User Seller2 (vinculado a María López)
INSERT INTO users (id, username, password, role, active, seller_id, created_at, updated_at)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'seller2',
  '$2b$10$OhIzvEdBDtVEWVoXHL//jOPUhyEDyk37yE34Ra3.vY5B689Y6Dj9q',  -- Seller123!
  'Seller',
  true,
  '22222222-2222-2222-2222-222222222222',  -- seller_id: María López
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
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Empresa ABC S.A. de C.V.',
  'Moral',
  'Prospecto',
  'Enviar propuesta comercial',
  '2026-06-10',
  '10:00',
  '11111111-1111-1111-1111-111111111111',  -- seller_id: Juan Pérez
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
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- client_id: Empresa ABC
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
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Llamar a Roberto García',
  'Seguimiento propuesta comercial',
  'Llamada',
  '2026-06-09T10:00:00Z',
  false,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
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
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Enviar cotización urgente',
  'Cliente solicitó cotización servicios',
  'Correo',
  '2026-06-08T14:00:00Z',
  false,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
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
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Reunión presencial oficinas ABC',
  'Presentación propuesta final',
  'Reunión presencial',
  '2026-06-10T11:00:00Z',
  false,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
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
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'Llamada',
  'Dar seguimiento a propuesta enviada',
  'Cliente revisó propuesta y tiene dudas sobre implementación y tiempos',
  'Requiere capacitación para equipo de ventas existente',
  'Enviar plan de capacitación detallado en 48 horas máximo',
  'Enviar documento de capacitación',
  '2026-06-11',
  '10:00',
  100,  -- 5 campos completos × 20% = 100%
  15,   -- capturada 15 min después
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '2026-06-09T09:45:00Z',  -- captured_at
  '2026-06-09T09:30:00Z',  -- executed_at
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
  '10101010-1010-1010-1010-101010101010',
  'Reunión presencial',
  'Presentación de propuesta comercial completa',
  'Reunión con Director General y equipo de compras de 3 personas, bien recibida',
  'Presupuesto aprobado internamente, decisión final en 2 semanas por comité',
  'Enviar contrato preliminar con términos y condiciones actualizados',
  'Seguimiento telefónico en 1 semana',
  '2026-06-16',
  '11:00',
  100,  -- 5 campos completos × 20% = 100%
  30,   -- capturada 30 min después
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '2026-06-09T14:30:00Z',  -- captured_at
  '2026-06-09T14:00:00Z',  -- executed_at
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
  '20202020-2020-2020-2020-202020202020',
  'Chat/WA',
  'Consulta sobre servicios',
  'Cliente preguntó por disponibilidad y precios básicos',
  'Interesado en plan enterprise',
  NULL,  -- no agreement
  'Enviar propuesta',
  '2026-06-09',
  NULL,  -- no time
  60,   -- 3 campos × 20% = 60%
  5,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
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
  '30303030-3030-3030-3030-303030303030',
  'Implementación Tracker Sales OS',
  'Sistema CRM para equipo de 5 vendedores con capacitación incluida',
  150000.00,
  'Propuesta',
  50,
  '[{"stage":"Prospecto","changedAt":"2026-06-05T10:00:00Z"},{"stage":"Contactado","changedAt":"2026-06-06T14:00:00Z"},{"stage":"Interesado","changedAt":"2026-06-07T11:00:00Z"},{"stage":"Propuesta","changedAt":"2026-06-09T09:00:00Z"}]'::jsonb,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
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
  '40404040-4040-4040-4040-404040404040',
  'Seller',
  'Nuevo',
  'Tracker Sales OS - Plan Enterprise',
  5,
  180000.00,
  'Pagado',
  'Prospección propia',
  '2026-06-05',
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. Crear Settings iniciales (si no existen)
-- ============================================================

INSERT INTO settings (id, key, value, created_at, updated_at)
VALUES (
  '50505050-5050-5050-5050-505050505050',
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
