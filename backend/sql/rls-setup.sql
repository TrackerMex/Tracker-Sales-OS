-- ============================================================
-- Row Level Security (RLS) setup for Tracker Sales OS
-- Run once against the PostgreSQL database as the tracker user
-- or any role with sufficient privileges.
--
-- Apply:
--   docker exec -i tracker-postgres psql -U tracker -d tracker_sales_os < backend/sql/rls-setup.sql
-- ============================================================

-- 1. Set database-level default so app.current_seller_id always
--    exists on new connections. Empty string = admin/system context.
ALTER DATABASE tracker_sales_os SET app.current_seller_id = '';

-- 2. Enable RLS on all seller-scoped tables.
--    FORCE applies the policy even to the table owner (tracker user).
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities FORCE ROW LEVEL SECURITY;

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals FORCE ROW LEVEL SECURITY;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales FORCE ROW LEVEL SECURITY;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;

-- 3. Create RLS policies.
--    Empty string  → admin/system context, full access.
--    UUID string   → seller context, restricted to own rows.
--    USING  = filter for SELECT/UPDATE/DELETE.
--    WITH CHECK = filter for INSERT/UPDATE.
CREATE POLICY rls_activities ON activities
  USING (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  )
  WITH CHECK (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  );

CREATE POLICY rls_deals ON deals
  USING (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  )
  WITH CHECK (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  );

CREATE POLICY rls_tasks ON tasks
  USING (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  )
  WITH CHECK (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  );

CREATE POLICY rls_sales ON sales
  USING (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  )
  WITH CHECK (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  );

CREATE POLICY rls_clients ON clients
  USING (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  )
  WITH CHECK (
    current_setting('app.current_seller_id') = ''
    OR seller_id::text = current_setting('app.current_seller_id')
  );

-- 4. Verify (optional)
-- SELECT tablename, rowsecurity, forcerls FROM pg_tables
-- WHERE tablename IN ('activities','deals','tasks','sales','clients');
