import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RepairRequest {
  id: string;
  tablet_id: string;
  requested_by_id: string;
  problem_description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assigned_technician?: string;
  status_notes?: string;
  requested_at: string;
  completed_at?: string;
  updated_at: string;
  // Relations
  tablet?: {
    id: string;
    tablet_id: string;
    model: string;
  };
  requested_by?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const useRepairRequests = () => {
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchRepairRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('repair_requests')
        .select(`
          *,
          tablets:tablet_id (
            id,
            tablet_id,
            model
          ),
          profiles:requested_by_id (
            id,
            full_name,
            email
          )
        `)
        .order('requested_at', { ascending: false });

      // Filter based on user role
      if (profile?.role === 'data_manager') {
        // Data managers can only see their own repair requests
        query = query.eq('requested_by_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setRepairRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching repair requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch repair requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRepairRequest = async (requestData: {
    tablet_id: string;
    problem_description: string;
    priority?: 'low' | 'medium' | 'high';
  }) => {
    try {
      const { error } = await supabase
        .from('repair_requests')
        .insert([{
          ...requestData,
          requested_by_id: profile?.id,
          status: 'pending',
          requested_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Repair request submitted successfully",
      });
      
      await fetchRepairRequests();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating repair request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit repair request",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateRepairRequest = async (id: string, updates: Partial<RepairRequest>) => {
    try {
      const { error } = await supabase
        .from('repair_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Repair request updated successfully",
      });
      
      await fetchRepairRequests();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating repair request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update repair request",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const completeRepairRequest = async (id: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('repair_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          status_notes: notes
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Repair request marked as completed",
      });
      
      await fetchRepairRequests();
      return { success: true };
    } catch (error: any) {
      console.error('Error completing repair request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete repair request",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchRepairRequests();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('repair-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'repair_requests'
          },
          () => {
            fetchRepairRequests();
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
            fetchRepairRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  return {
    repairRequests,
    loading,
    fetchRepairRequests,
    createRepairRequest,
    updateRepairRequest,
    completeRepairRequest,
  };
};