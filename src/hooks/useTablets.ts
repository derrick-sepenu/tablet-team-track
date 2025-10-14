import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Tablet {
  id: string;
  tablet_id: string;
  serial_number: string;
  model: string;
  sim_number?: string;
  status: 'available' | 'assigned' | 'in_repair' | 'lost' | 'returned';
  notes?: string;
  assigned_project_id?: string;
  date_assigned?: string;
  created_at: string;
  updated_at: string;
  // Relations
  project?: {
    id: string;
    name: string;
    data_manager?: {
      id: string;
      full_name: string;
    };
  };
  field_worker?: {
    id: string;
    full_name: string;
  };
}

export const useTablets = () => {
  const [tablets, setTablets] = useState<Tablet[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchTablets = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('tablets')
        .select(`
          *,
          projects:assigned_project_id (
            id,
            name,
            data_manager:profiles!projects_data_manager_id_fkey (
              id,
              full_name
            )
          ),
          field_workers:field_workers!field_workers_assigned_tablet_id_fkey (
            id,
            full_name
          )
        `);

      // Filter based on user role
      if (profile?.role === 'data_manager') {
        // Data managers can only see tablets assigned to their projects
        const { data: managerProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('data_manager_id', profile.id);
        
        const projectIds = managerProjects?.map(p => p.id) || [];
        if (projectIds.length > 0) {
          query = query.in('assigned_project_id', projectIds);
        } else {
          // If no projects assigned, return empty array
          setTablets([]);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setTablets(data || []);
    } catch (error: any) {
      console.error('Error fetching tablets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tablets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTablet = async (tabletData: {
    tablet_id: string;
    serial_number: string;
    model: string;
    sim_number?: string;
    status?: 'available' | 'assigned' | 'in_repair' | 'lost' | 'returned';
    notes?: string;
    assigned_project_id?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('tablets')
        .insert([tabletData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tablet added successfully",
      });
      
      await fetchTablets();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating tablet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add tablet",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateTablet = async (id: string, updates: Partial<Tablet>) => {
    try {
      const { error } = await supabase
        .from('tablets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tablet updated successfully",
      });
      
      await fetchTablets();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating tablet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update tablet",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteTablet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tablets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tablet deleted successfully",
      });
      
      await fetchTablets();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting tablet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete tablet",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const assignTablet = async (tabletId: string, workerId: string, projectId: string) => {
    try {
      // Update tablet assignment
      const { error: tabletError } = await supabase
        .from('tablets')
        .update({ 
          assigned_project_id: projectId,
          status: 'assigned',
          date_assigned: new Date().toISOString()
        })
        .eq('id', tabletId);

      if (tabletError) throw tabletError;

      // Update field worker assignment
      const { error: workerError } = await supabase
        .from('field_workers')
        .update({ 
          assigned_tablet_id: tabletId,
          assigned_project_id: projectId,
          assignment_date: new Date().toISOString()
        })
        .eq('id', workerId);

      if (workerError) throw workerError;

      toast({
        title: "Success",
        description: "Tablet assigned successfully",
      });
      
      await fetchTablets();
      return { success: true };
    } catch (error: any) {
      console.error('Error assigning tablet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign tablet",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchTablets();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('tablets-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tablets'
          },
          () => {
            fetchTablets();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'field_workers'
          },
          () => {
            fetchTablets();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  return {
    tablets,
    loading,
    fetchTablets,
    createTablet,
    updateTablet,
    deleteTablet,
    assignTablet,
  };
};