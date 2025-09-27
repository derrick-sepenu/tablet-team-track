import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  name: string;
  description?: string;
  data_manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  data_manager?: {
    id: string;
    full_name: string;
    email: string;
  };
  tablets?: Array<{
    id: string;
    tablet_id: string;
    model: string;
  }>;
  field_workers?: Array<{
    id: string;
    full_name: string;
    staff_id: string;
  }>;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('projects')
        .select(`
          *,
          profiles:data_manager_id (
            id,
            full_name,
            email
          ),
          tablets (
            id,
            tablet_id,
            model
          ),
          field_workers (
            id,
            full_name,
            staff_id
          )
        `);

      // Filter based on user role
      if (profile?.role === 'data_manager') {
        // Data managers can only see their assigned projects
        query = query.eq('data_manager_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: {
    name: string;
    description?: string;
    data_manager_id?: string;
    is_active?: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });
      
      await fetchProjects();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      
      await fetchProjects();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      
      await fetchProjects();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchProjects();
    }
  }, [profile]);

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};