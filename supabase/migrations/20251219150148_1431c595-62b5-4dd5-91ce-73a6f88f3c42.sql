-- Remove overly permissive policies that bypass access control
DROP POLICY IF EXISTS "Require authentication to access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Require authentication to access field_workers" ON public.field_workers;
DROP POLICY IF EXISTS "Require authentication to access tablets" ON public.tablets;
DROP POLICY IF EXISTS "Require authentication to access user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Require authentication to access repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Require authentication to access projects" ON public.projects;
DROP POLICY IF EXISTS "Require authentication to access audit_logs" ON public.audit_logs;

-- Drop the existing RESTRICTIVE policies and recreate as PERMISSIVE
-- This ensures proper access control while blocking anonymous access

-- PROFILES
DROP POLICY IF EXISTS "Data managers can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (is_super_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can update all profiles" ON public.profiles
FOR UPDATE TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can insert profiles" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (is_super_admin());

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update roles" ON public.user_roles
FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;

CREATE POLICY "Super admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated USING (is_super_admin());

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (
  (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())) 
  OR (user_id IS NULL)
);

-- PROJECTS
DROP POLICY IF EXISTS "Data managers can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can manage all projects" ON public.projects;

CREATE POLICY "Data managers can view assigned projects" ON public.projects
FOR SELECT TO authenticated USING (
  data_manager_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Super admins can select all projects" ON public.projects
FOR SELECT TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can insert projects" ON public.projects
FOR INSERT TO authenticated WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update projects" ON public.projects
FOR UPDATE TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can delete projects" ON public.projects
FOR DELETE TO authenticated USING (is_super_admin());

-- TABLETS
DROP POLICY IF EXISTS "Data managers can view project tablets" ON public.tablets;
DROP POLICY IF EXISTS "Data managers can update project tablets" ON public.tablets;
DROP POLICY IF EXISTS "Super admins can manage all tablets" ON public.tablets;

CREATE POLICY "Data managers can view project tablets" ON public.tablets
FOR SELECT TO authenticated USING (
  assigned_project_id IN (
    SELECT id FROM projects WHERE data_manager_id IN (
      SELECT id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Data managers can update project tablets" ON public.tablets
FOR UPDATE TO authenticated USING (
  assigned_project_id IN (
    SELECT id FROM projects WHERE data_manager_id IN (
      SELECT id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Super admins can select all tablets" ON public.tablets
FOR SELECT TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can insert tablets" ON public.tablets
FOR INSERT TO authenticated WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update tablets" ON public.tablets
FOR UPDATE TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can delete tablets" ON public.tablets
FOR DELETE TO authenticated USING (is_super_admin());

-- FIELD_WORKERS
DROP POLICY IF EXISTS "Data managers can manage project field workers" ON public.field_workers;
DROP POLICY IF EXISTS "Super admins can manage all field workers" ON public.field_workers;

CREATE POLICY "Data managers can view project field workers" ON public.field_workers
FOR SELECT TO authenticated USING (
  assigned_project_id IN (
    SELECT id FROM projects WHERE data_manager_id IN (
      SELECT id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Data managers can insert project field workers" ON public.field_workers
FOR INSERT TO authenticated WITH CHECK (
  assigned_project_id IN (
    SELECT id FROM projects WHERE data_manager_id IN (
      SELECT id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Data managers can update project field workers" ON public.field_workers
FOR UPDATE TO authenticated USING (
  assigned_project_id IN (
    SELECT id FROM projects WHERE data_manager_id IN (
      SELECT id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Data managers can delete project field workers" ON public.field_workers
FOR DELETE TO authenticated USING (
  assigned_project_id IN (
    SELECT id FROM projects WHERE data_manager_id IN (
      SELECT id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Super admins can select all field workers" ON public.field_workers
FOR SELECT TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can insert field workers" ON public.field_workers
FOR INSERT TO authenticated WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update field workers" ON public.field_workers
FOR UPDATE TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can delete field workers" ON public.field_workers
FOR DELETE TO authenticated USING (is_super_admin());

-- REPAIR_REQUESTS
DROP POLICY IF EXISTS "Data managers can manage own repair requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Super admins can manage all repair requests" ON public.repair_requests;

CREATE POLICY "Users can view own repair requests" ON public.repair_requests
FOR SELECT TO authenticated USING (
  requested_by_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can insert own repair requests" ON public.repair_requests
FOR INSERT TO authenticated WITH CHECK (
  requested_by_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can update own repair requests" ON public.repair_requests
FOR UPDATE TO authenticated USING (
  requested_by_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can delete own repair requests" ON public.repair_requests
FOR DELETE TO authenticated USING (
  requested_by_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Super admins can select all repair requests" ON public.repair_requests
FOR SELECT TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can insert repair requests" ON public.repair_requests
FOR INSERT TO authenticated WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update repair requests" ON public.repair_requests
FOR UPDATE TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can delete repair requests" ON public.repair_requests
FOR DELETE TO authenticated USING (is_super_admin());