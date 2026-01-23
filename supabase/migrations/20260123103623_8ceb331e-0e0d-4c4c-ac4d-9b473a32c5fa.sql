-- Create enum for inventory item categories
CREATE TYPE public.inventory_category AS ENUM ('laptop', 'desktop', 'mouse', 'keyboard', 'monitor', 'printer', 'networking', 'storage', 'accessories', 'other');

-- Create enum for inventory item condition
CREATE TYPE public.inventory_condition AS ENUM ('new', 'good', 'fair', 'poor', 'damaged', 'decommissioned');

-- Create inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  category inventory_category NOT NULL DEFAULT 'other',
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  asset_tag TEXT,
  condition inventory_condition NOT NULL DEFAULT 'new',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  location TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  warranty_expiry DATE,
  assigned_to TEXT,
  notes TEXT CHECK (char_length(notes) <= 500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to inventory_items"
ON public.inventory_items
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Super admins can do everything
CREATE POLICY "Super admins can select all inventory items"
ON public.inventory_items
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can insert inventory items"
ON public.inventory_items
FOR INSERT
WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update inventory items"
ON public.inventory_items
FOR UPDATE
USING (is_super_admin());

CREATE POLICY "Super admins can delete inventory items"
ON public.inventory_items
FOR DELETE
USING (is_super_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit trigger
CREATE OR REPLACE FUNCTION public.audit_inventory_items_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log('INSERT', 'inventory_items', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log('UPDATE', 'inventory_items', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log('DELETE', 'inventory_items', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_inventory_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.audit_inventory_items_changes();