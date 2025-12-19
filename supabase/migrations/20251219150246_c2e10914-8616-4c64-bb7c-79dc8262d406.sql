-- Add explicit policies to deny anonymous access to all tables
-- These policies ensure the anon role cannot read any data

-- Deny anonymous access to profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Deny anonymous access to field_workers
CREATE POLICY "Deny anonymous access to field_workers"
ON public.field_workers
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Deny anonymous access to tablets
CREATE POLICY "Deny anonymous access to tablets"
ON public.tablets
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Deny anonymous access to user_roles
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Deny anonymous access to repair_requests
CREATE POLICY "Deny anonymous access to repair_requests"
ON public.repair_requests
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Deny anonymous access to projects
CREATE POLICY "Deny anonymous access to projects"
ON public.projects
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Deny anonymous access to audit_logs
CREATE POLICY "Deny anonymous access to audit_logs"
ON public.audit_logs
FOR ALL
TO anon
USING (false)
WITH CHECK (false);