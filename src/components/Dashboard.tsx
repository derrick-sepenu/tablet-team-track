import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import StatsWidget from '@/components/StatsWidget';
import { 
  Plus,
  AlertTriangle,
  User,
  Calendar
} from "lucide-react";

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions for alerts and activity
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs'
        },
        () => {
          fetchRecentActivity();
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
          fetchCriticalAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchRecentActivity = async () => {
    const { data: auditData } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentActivity(auditData || []);
  };

  const fetchCriticalAlerts = async () => {
    const { data: alertsData } = await supabase
      .from('repair_requests')
      .select(`
        *,
        tablets!inner(tablet_id, model),
        profiles!inner(full_name)
      `)
      .eq('priority', 'high')
      .eq('status', 'pending')
      .limit(5);

    setCriticalAlerts(alertsData || []);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRecentActivity(),
        fetchCriticalAlerts()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'super_admin' 
              ? 'Monitor your tablet fleet and field operations' 
              : 'Manage your assigned projects and tablets'
            }
          </p>
        </div>
        {profile?.role === 'super_admin' && (
          <Button className="bg-primary hover:bg-primary-hover" onClick={() => navigate('/tablets')}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Tablet
          </Button>
        )}
      </div>

      {/* Real-Time Stats Widget */}
      <StatsWidget />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Critical Alerts
            </CardTitle>
            <CardDescription>Repair requests requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {criticalAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No critical alerts at this time
              </p>
            ) : (
              criticalAlerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-4 py-3 border-b last:border-b-0">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{alert.tablets.tablet_id}</p>
                      <Badge variant="destructive" className="text-xs">
                        {alert.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.problem_description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{alert.profiles.full_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(alert.requested_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your system</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 py-3 border-b last:border-b-0">
                  <div className="flex-shrink-0 pt-1">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {activity.entity_type}: {activity.entity_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;