-- Allow super admins to update any profile role
CREATE POLICY "Super admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin' 
    AND p.is_active = true
  )
);

-- Also ensure super admins can insert profiles for new users
CREATE POLICY "Super admins can insert profiles for new users" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin' 
    AND p.is_active = true
  )
);