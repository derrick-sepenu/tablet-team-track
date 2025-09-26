-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('super_admin', 'data_manager');

-- Create tablet status enum  
CREATE TYPE public.tablet_status AS ENUM ('available', 'assigned', 'in_repair', 'lost', 'returned');

-- Create repair status enum
CREATE TYPE public.repair_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create priority level enum
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high');

-- Create user profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'data_manager',
    is_active BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    data_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tablets table
CREATE TABLE public.tablets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tablet_id TEXT NOT NULL UNIQUE, -- TB-0001, TB-0002, etc.
    serial_number TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    sim_number TEXT,
    status tablet_status NOT NULL DEFAULT 'available',
    assigned_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    date_assigned TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create field workers table
CREATE TABLE public.field_workers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    staff_id TEXT NOT NULL UNIQUE,
    assigned_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    assigned_tablet_id UUID REFERENCES public.tablets(id) ON DELETE SET NULL,
    assignment_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create repair requests table
CREATE TABLE public.repair_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tablet_id UUID NOT NULL REFERENCES public.tablets(id) ON DELETE CASCADE,
    requested_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_description TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'medium',
    status repair_status NOT NULL DEFAULT 'pending',
    assigned_technician TEXT,
    status_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'tablet', 'field_worker', 'repair_request', etc.
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tablets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user is data manager of project
CREATE OR REPLACE FUNCTION public.is_data_manager_of_project(project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.projects pr ON p.id = pr.data_manager_id
    WHERE p.user_id = auth.uid() AND pr.id = project_id AND p.is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Data managers can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_super_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for projects
CREATE POLICY "Super admins can manage all projects" ON public.projects
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Data managers can view assigned projects" ON public.projects
  FOR SELECT USING (data_manager_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for tablets
CREATE POLICY "Super admins can manage all tablets" ON public.tablets
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Data managers can view project tablets" ON public.tablets
  FOR SELECT USING (
    assigned_project_id IN (
      SELECT id FROM public.projects WHERE data_manager_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Data managers can update project tablets" ON public.tablets
  FOR UPDATE USING (
    assigned_project_id IN (
      SELECT id FROM public.projects WHERE data_manager_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for field workers
CREATE POLICY "Super admins can manage all field workers" ON public.field_workers
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Data managers can manage project field workers" ON public.field_workers
  FOR ALL USING (
    assigned_project_id IN (
      SELECT id FROM public.projects WHERE data_manager_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for repair requests
CREATE POLICY "Super admins can manage all repair requests" ON public.repair_requests
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Data managers can manage own repair requests" ON public.repair_requests
  FOR ALL USING (requested_by_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for audit logs
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_super_admin());

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@institution.com' THEN 'super_admin'::user_role
      ELSE 'data_manager'::user_role
    END,
    CASE 
      WHEN NEW.email = 'admin@institution.com' THEN true
      ELSE false
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tablets_updated_at BEFORE UPDATE ON public.tablets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_field_workers_updated_at BEFORE UPDATE ON public.field_workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_requests_updated_at BEFORE UPDATE ON public.repair_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate tablet IDs
CREATE OR REPLACE FUNCTION public.generate_tablet_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  tablet_id TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(tablet_id FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.tablets
  WHERE tablet_id ~ '^TB-[0-9]+$';
  
  tablet_id := 'TB-' || LPAD(next_num::TEXT, 4, '0');
  RETURN tablet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;