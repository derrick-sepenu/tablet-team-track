-- Fix security vulnerability: Change PERMISSIVE deny policies to RESTRICTIVE
-- PERMISSIVE policies are OR'd together, meaning they don't actually block access
-- RESTRICTIVE policies are AND'd together, providing proper blocking

-- Fix audit_logs: Drop PERMISSIVE and create RESTRICTIVE
DROP POLICY IF EXISTS "Deny anonymous access to audit_logs" ON public.audit_logs;
CREATE POLICY "Deny anonymous access to audit_logs" ON public.audit_logs
AS RESTRICTIVE
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Fix field_workers: Drop PERMISSIVE and create RESTRICTIVE
DROP POLICY IF EXISTS "Deny anonymous access to field_workers" ON public.field_workers;
CREATE POLICY "Deny anonymous access to field_workers" ON public.field_workers
AS RESTRICTIVE
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Fix profiles: Drop PERMISSIVE and create RESTRICTIVE
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous access to profiles" ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Fix projects: Drop PERMISSIVE and create RESTRICTIVE
DROP POLICY IF EXISTS "Deny anonymous access to projects" ON public.projects;
CREATE POLICY "Deny anonymous access to projects" ON public.projects
AS RESTRICTIVE
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Fix repair_requests: Drop PERMISSIVE and create RESTRICTIVE
DROP POLICY IF EXISTS "Deny anonymous access to repair_requests" ON public.repair_requests;
CREATE POLICY "Deny anonymous access to repair_requests" ON public.repair_requests
AS RESTRICTIVE
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Fix tablets: Drop PERMISSIVE and create RESTRICTIVE
DROP POLICY IF EXISTS "Deny anonymous access to tablets" ON public.tablets;
CREATE POLICY "Deny anonymous access to tablets" ON public.tablets
AS RESTRICTIVE
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Fix user_roles: Drop PERMISSIVE and create RESTRICTIVE
DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;
CREATE POLICY "Deny anonymous access to user_roles" ON public.user_roles
AS RESTRICTIVE
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');