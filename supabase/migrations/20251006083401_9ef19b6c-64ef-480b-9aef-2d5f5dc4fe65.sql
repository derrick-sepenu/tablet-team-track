-- Add last_password_change column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_password_change timestamp with time zone DEFAULT now();

-- Update existing records to have the current timestamp
UPDATE public.profiles
SET last_password_change = now()
WHERE last_password_change IS NULL;

-- Create a trigger to update last_password_change when password is changed
CREATE OR REPLACE FUNCTION public.update_last_password_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.last_password_change = now();
  RETURN NEW;
END;
$function$;

-- Create trigger that fires when must_change_password is set to false (indicating password was changed)
CREATE OR REPLACE TRIGGER on_password_changed
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.must_change_password = true AND NEW.must_change_password = false)
  EXECUTE FUNCTION public.update_last_password_change();