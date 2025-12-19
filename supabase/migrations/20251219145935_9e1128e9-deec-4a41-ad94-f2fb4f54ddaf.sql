-- Add PERMISSIVE policies to require authentication on all tables
-- This blocks unauthenticated/anonymous access

-- Profiles table: require authentication to view
CREATE POLICY "Require authentication to access profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Field workers table: require authentication to view
CREATE POLICY "Require authentication to access field_workers"
ON public.field_workers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Tablets table: require authentication to view
CREATE POLICY "Require authentication to access tablets"
ON public.tablets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- User roles table: require authentication to view
CREATE POLICY "Require authentication to access user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Repair requests table: require authentication to view
CREATE POLICY "Require authentication to access repair_requests"
ON public.repair_requests
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Projects table: require authentication to view
CREATE POLICY "Require authentication to access projects"
ON public.projects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Audit logs table: require authentication to view
CREATE POLICY "Require authentication to access audit_logs"
ON public.audit_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);