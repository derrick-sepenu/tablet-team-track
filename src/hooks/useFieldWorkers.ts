import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FieldWorker {
  id: string;
  staff_id: string;
  full_name: string;
  assigned_tablet_id?: string;
  assigned_project_id?: string;
  is_active: boolean;
  assignment_date?: string;
  created_at: string;
  updated_at: string;
  // Relations
  project?: {
    id: string;
    name: string;
  };
  tablet?: {
    id: string;
    tablet_id: string;
    model: string;
  };
}

export const useFieldWorkers = () => {
  const [workers, setWorkers] = useState<FieldWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('field_workers')
        .select(`
          *,
          projects:assigned_project_id (
            id,
            name
          ),
          tablets:assigned_tablet_id (
            id,
            tablet_id,
            model
          )
        `);

      // Filter based on user role
      if (profile?.role === 'data_manager') {
        // Data managers can only see workers assigned to their projects
        const { data: managerProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('data_manager_id', profile.id);
        
        const projectIds = managerProjects?.map(p => p.id) || [];
        if (projectIds.length > 0) {
          query = query.in('assigned_project_id', projectIds);
        } else {
          // If no projects assigned, return empty array
          setWorkers([]);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform tablets object to tablet object
      const transformedData = data?.map(worker => ({
        ...worker,
        tablet: worker.tablets || null
      })) || [];
      
      setWorkers(transformedData);
    } catch (error: any) {
      console.error('Error fetching workers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch field workers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorker = async (workerData: {
    staff_id: string;
    full_name: string;
    assigned_tablet_id?: string;
    assigned_project_id?: string;
    is_active?: boolean;
  }) => {
    // Create optimistic worker with temporary ID
    const optimisticWorker: FieldWorker = {
      id: `temp-${Date.now()}`,
      staff_id: workerData.staff_id,
      full_name: workerData.full_name,
      assigned_tablet_id: workerData.assigned_tablet_id,
      assigned_project_id: workerData.assigned_project_id,
      is_active: workerData.is_active ?? true,
      assignment_date: workerData.assigned_tablet_id ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add optimistically to UI
    setWorkers(prev => [optimisticWorker, ...prev]);

    try {
      const { error } = await supabase
        .from('field_workers')
        .insert([workerData]);

      if (error) throw error;

      // Wait for the data to be refetched to get real data
      await fetchWorkers();
      
      toast({
        title: "Success",
        description: "Field worker added successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      // Remove optimistic worker on error
      setWorkers(prev => prev.filter(w => w.id !== optimisticWorker.id));
      
      console.error('Error creating worker:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add field worker",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateWorker = async (id: string, updates: Partial<FieldWorker>) => {
    // Store original worker for rollback
    const originalWorker = workers.find(w => w.id === id);
    
    // Apply optimistic update
    setWorkers(prev => prev.map(worker => 
      worker.id === id 
        ? { ...worker, ...updates, updated_at: new Date().toISOString() }
        : worker
    ));

    try {
      const { error } = await supabase
        .from('field_workers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Wait for the data to be refetched to get confirmed data
      await fetchWorkers();
      
      toast({
        title: "Success",
        description: "Field worker updated successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      // Rollback optimistic update on error
      if (originalWorker) {
        setWorkers(prev => prev.map(worker => 
          worker.id === id ? originalWorker : worker
        ));
      }
      
      console.error('Error updating worker:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update field worker",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteWorker = async (id: string) => {
    // Store original worker for rollback
    const originalWorker = workers.find(w => w.id === id);
    
    // Remove optimistically from UI
    setWorkers(prev => prev.filter(w => w.id !== id));

    try {
      const { error } = await supabase
        .from('field_workers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field worker deleted successfully",
      });
      
      await fetchWorkers();
      return { success: true };
    } catch (error: any) {
      // Restore worker on error
      if (originalWorker) {
        setWorkers(prev => [...prev, originalWorker]);
      }
      
      console.error('Error deleting worker:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete field worker",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchWorkers();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('workers-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'field_workers'
          },
          () => {
            fetchWorkers();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tablets'
          },
          () => {
            fetchWorkers();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects'
          },
          () => {
            fetchWorkers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  return {
    workers,
    loading,
    fetchWorkers,
    createWorker,
    updateWorker,
    deleteWorker,
  };
};