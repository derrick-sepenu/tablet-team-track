import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { DashboardStats } from './useDashboardStats';

interface ThresholdConfig {
  minAvailableTablets: number;
  maxPendingRepairs: number;
  minActiveWorkersRatio: number; // ratio of active workers to assigned tablets
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  minAvailableTablets: 5,
  maxPendingRepairs: 10,
  minActiveWorkersRatio: 0.8,
};

export const useThresholdAlerts = (
  stats: DashboardStats,
  loading: boolean,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
) => {
  const alertedRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (loading) return;

    // Skip alerts on initial load to avoid spamming
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    const alerts: { id: string; title: string; description: string; variant: 'default' | 'destructive' }[] = [];

    // Check low available tablets
    if (stats.availableTablets <= thresholds.minAvailableTablets && stats.totalTablets > 0) {
      const alertId = 'low-available-tablets';
      if (!alertedRef.current.has(alertId)) {
        alerts.push({
          id: alertId,
          title: 'Low Available Tablets',
          description: `Only ${stats.availableTablets} tablets available. Consider returning or adding more tablets.`,
          variant: stats.availableTablets === 0 ? 'destructive' : 'default',
        });
        alertedRef.current.add(alertId);
      }
    } else {
      alertedRef.current.delete('low-available-tablets');
    }

    // Check high pending repairs
    if (stats.pendingRepairRequests >= thresholds.maxPendingRepairs) {
      const alertId = 'high-pending-repairs';
      if (!alertedRef.current.has(alertId)) {
        alerts.push({
          id: alertId,
          title: 'High Pending Repairs',
          description: `${stats.pendingRepairRequests} repair requests are pending. Review and address them promptly.`,
          variant: 'destructive',
        });
        alertedRef.current.add(alertId);
      }
    } else {
      alertedRef.current.delete('high-pending-repairs');
    }

    // Check tablets in repair ratio
    const inRepairRatio = stats.totalTablets > 0 ? stats.inRepairTablets / stats.totalTablets : 0;
    if (inRepairRatio > 0.2 && stats.inRepairTablets > 3) {
      const alertId = 'high-repair-ratio';
      if (!alertedRef.current.has(alertId)) {
        alerts.push({
          id: alertId,
          title: 'Many Tablets In Repair',
          description: `${stats.inRepairTablets} tablets (${Math.round(inRepairRatio * 100)}%) are currently in repair.`,
          variant: 'default',
        });
        alertedRef.current.add(alertId);
      }
    } else {
      alertedRef.current.delete('high-repair-ratio');
    }

    // Check worker to tablet ratio
    if (stats.assignedTablets > 0 && stats.activeWorkers < stats.assignedTablets * thresholds.minActiveWorkersRatio) {
      const alertId = 'low-worker-ratio';
      if (!alertedRef.current.has(alertId)) {
        alerts.push({
          id: alertId,
          title: 'Worker Shortage',
          description: `Only ${stats.activeWorkers} active workers for ${stats.assignedTablets} assigned tablets.`,
          variant: 'default',
        });
        alertedRef.current.add(alertId);
      }
    } else {
      alertedRef.current.delete('low-worker-ratio');
    }

    // Display alerts with slight delay between each
    alerts.forEach((alert, index) => {
      setTimeout(() => {
        toast({
          title: alert.title,
          description: alert.description,
          variant: alert.variant,
        });
      }, index * 500);
    });
  }, [stats, loading, thresholds]);

  // Reset alerts when component unmounts or stats reset
  useEffect(() => {
    return () => {
      alertedRef.current.clear();
    };
  }, []);
};
