-- Add INSERT policy for data managers on tablets
CREATE POLICY "Data managers can insert project tablets" 
ON public.tablets 
FOR INSERT 
WITH CHECK (
  assigned_project_id IN (
    SELECT projects.id
    FROM projects
    WHERE projects.data_manager_id IN (
      SELECT profiles.id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  )
);

-- Add DELETE policy for data managers on tablets
CREATE POLICY "Data managers can delete project tablets" 
ON public.tablets 
FOR DELETE 
USING (
  assigned_project_id IN (
    SELECT projects.id
    FROM projects
    WHERE projects.data_manager_id IN (
      SELECT profiles.id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  )
);