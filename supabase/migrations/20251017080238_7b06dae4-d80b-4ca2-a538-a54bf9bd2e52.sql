-- Fix security issues in handle_new_user() trigger
-- Remove hardcoded admin email logic and enforce data_manager as default role

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles (without automatic role assignment)
  INSERT INTO public.profiles (user_id, full_name, email, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    false
  );

  -- Insert default role as data_manager for all new signups
  -- Super admins must be created via the create-user edge function by existing super admins
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'data_manager');

  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add database constraints for input validation
-- Add CHECK constraint for problem_description length (max 5000 characters)
ALTER TABLE public.repair_requests 
  DROP CONSTRAINT IF EXISTS check_problem_description_length;

ALTER TABLE public.repair_requests 
  ADD CONSTRAINT check_problem_description_length 
  CHECK (char_length(problem_description) <= 5000);

-- Add CHECK constraint for staff_id format (exactly 2 uppercase letters)
ALTER TABLE public.field_workers 
  DROP CONSTRAINT IF EXISTS check_staff_id_format;

ALTER TABLE public.field_workers 
  ADD CONSTRAINT check_staff_id_format 
  CHECK (staff_id ~ '^[A-Z]{2}$');

-- Add CHECK constraint for full_name length
ALTER TABLE public.field_workers 
  DROP CONSTRAINT IF EXISTS check_full_name_length;

ALTER TABLE public.field_workers 
  ADD CONSTRAINT check_full_name_length 
  CHECK (char_length(full_name) > 0 AND char_length(full_name) <= 100);

-- Add CHECK constraint for tablet notes length
ALTER TABLE public.tablets 
  DROP CONSTRAINT IF EXISTS check_notes_length;

ALTER TABLE public.tablets 
  ADD CONSTRAINT check_notes_length 
  CHECK (notes IS NULL OR char_length(notes) <= 2000);

-- Add CHECK constraint for status_notes length
ALTER TABLE public.repair_requests 
  DROP CONSTRAINT IF EXISTS check_status_notes_length;

ALTER TABLE public.repair_requests 
  ADD CONSTRAINT check_status_notes_length 
  CHECK (status_notes IS NULL OR char_length(status_notes) <= 2000);