import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalTablets: number;
  availableTablets: number;
  assignedTablets: number;
  activeWorkers: number;
  pendingRepairRequests: number;
  totalProjects: number;
  inRepairTablets: number;
  returnedTablets: number;
  lostTablets: number;
}

export const useDashboardStats = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTablets: 0,
    availableTablets: 0,
    assignedTablets: 0,
    activeWorkers: 0,
    pendingRepairRequests: 0,
    totalProjects: 0,
    inRepairTablets: 0,
    returnedTablets: 0,
    lostTablets: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Build queries based on user role
      let tabletsQuery = supabase.from('tablets').select('status', { count: 'exact' });
      let workersQuery = supabase.from('field_workers').select('is_active', { count: 'exact' });
      let projectsQuery = supabase.from('projects').select('id', { count: 'exact' });
      let repairRequestsQuery = supabase.from('repair_requests').select('status', { count: 'exact' });

      // Apply role-based filtering
      if (profile.role === 'data_manager') {
        // Data managers only see their projects and related data
        const { data: managerProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('data_manager_id', profile.id);

        const projectIds = managerProjects?.map(p => p.id) || [];

        if (projectIds.length > 0) {
          tabletsQuery = tabletsQuery.in('assigned_project_id', projectIds);
          workersQuery = workersQuery.in('assigned_project_id', projectIds);
          repairRequestsQuery = repairRequestsQuery.eq('requested_by_id', profile.id);
        } else {
          // No projects assigned, return zeros
          setStats({
            totalTablets: 0,
            availableTablets: 0,
            assignedTablets: 0,
            activeWorkers: 0,
            pendingRepairRequests: 0,
            totalProjects: 0,
            inRepairTablets: 0,
          });
          setLoading(false);
          return;
        }

        projectsQuery = projectsQuery.eq('data_manager_id', profile.id);
      }

      // Fetch all data in parallel
      const [tabletsRes, workersRes, projectsRes, repairRequestsRes] = await Promise.all([
        tabletsQuery,
        workersQuery,
        projectsQuery,
        repairRequestsQuery,
      ]);

      // Calculate statistics
      const tablets = tabletsRes.data || [];
      const workers = workersRes.data || [];
      const repairRequests = repairRequestsRes.data || [];

      const availableTablets = tablets.filter(t => t.status === 'available').length;
      const assignedTablets = tablets.filter(t => t.status === 'assigned').length;
      const inRepairTablets = tablets.filter(t => t.status === 'in_repair').length;
      const activeWorkers = workers.filter(w => w.is_active).length;
      const pendingRepairRequests = repairRequests.filter(r => r.status === 'pending').length;

      setStats({
        totalTablets: tabletsRes.count || 0,
        availableTablets,
        assignedTablets,
        activeWorkers,
        pendingRepairRequests,
        totalProjects: projectsRes.count || 0,
        inRepairTablets,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchStats();

      // Set up real-time subscriptions for auto-refresh
      const channel = supabase
        .channel('dashboard-stats')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tablets'
          },
          () => {
            fetchStats();
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
            fetchStats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'repair_requests'
          },
          () => {
            fetchStats();
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
            fetchStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  return {
    stats,
    loading,
    refreshStats: fetchStats,
  };
};
