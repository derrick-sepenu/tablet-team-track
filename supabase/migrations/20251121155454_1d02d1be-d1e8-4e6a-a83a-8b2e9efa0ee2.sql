-- Fix: Add INSERT policy to audit_logs table
CREATE POLICY "Users can insert own audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR user_id IS NULL
);

-- Create helper function for audit logging
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB,
  p_new_values JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (v_profile_id, p_action, p_entity_type, p_entity_id, p_old_values, p_new_values);
END;
$$;

-- Trigger function for user_roles
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log('INSERT', 'user_roles', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log('UPDATE', 'user_roles', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log('DELETE', 'user_roles', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger function for profiles
CREATE OR REPLACE FUNCTION public.audit_profiles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log('INSERT', 'profiles', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log('UPDATE', 'profiles', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log('DELETE', 'profiles', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger function for projects
CREATE OR REPLACE FUNCTION public.audit_projects_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log('INSERT', 'projects', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log('UPDATE', 'projects', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log('DELETE', 'projects', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger function for tablets
CREATE OR REPLACE FUNCTION public.audit_tablets_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log('INSERT', 'tablets', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log('UPDATE', 'tablets', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log('DELETE', 'tablets', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger function for field_workers
CREATE OR REPLACE FUNCTION public.audit_field_workers_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log('INSERT', 'field_workers', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log('UPDATE', 'field_workers', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log('DELETE', 'field_workers', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger function for repair_requests
CREATE OR REPLACE FUNCTION public.audit_repair_requests_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log('INSERT', 'repair_requests', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log('UPDATE', 'repair_requests', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log('DELETE', 'repair_requests', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for all critical tables
CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_user_roles_changes();

CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_profiles_changes();

CREATE TRIGGER audit_projects_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.audit_projects_changes();

CREATE TRIGGER audit_tablets_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tablets
FOR EACH ROW EXECUTE FUNCTION public.audit_tablets_changes();

CREATE TRIGGER audit_field_workers_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.field_workers
FOR EACH ROW EXECUTE FUNCTION public.audit_field_workers_changes();

CREATE TRIGGER audit_repair_requests_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.repair_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_repair_requests_changes();