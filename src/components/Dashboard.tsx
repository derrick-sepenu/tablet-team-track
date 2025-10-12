import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  Tablet, 
  Users, 
  Activity,
  Plus,
  AlertTriangle,
  User,
  Calendar,
  Wrench,
  FolderOpen
} from "lucide-react";

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTablets: 0,
    activeTablets: 0,
    fieldWorkers: 0,
    activeProjects: 0,
    repairRequests: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats based on user role
      let tabletsQuery = supabase.from('tablets').select('*', { count: 'exact' });
      let workersQuery = supabase.from('field_workers').select('*', { count: 'exact' });
      let projectsQuery = supabase.from('projects').select('*', { count: 'exact' }).eq('is_active', true);
      
      const [tabletsRes, workersRes, projectsRes] = await Promise.all([
        tabletsQuery,
        workersQuery,
        projectsQuery,
      ]);

      const activeTablets = tabletsRes.data?.filter(t => t.status === 'assigned').length || 0;

      let repairRequestsCount = 0;
      if (profile?.role === 'super_admin') {
        const { count } = await supabase
          .from('repair_requests')
          .select('*', { count: 'exact' })
          .eq('status', 'pending');
        repairRequestsCount = count || 0;
      }

      setStats({
        totalTablets: tabletsRes.count || 0,
        activeTablets,
        fieldWorkers: workersRes.count || 0,
        activeProjects: projectsRes.count || 0,
        repairRequests: repairRequestsCount,
      });

      // Fetch recent activity
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(auditData || []);

      // Fetch critical alerts
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
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
          <Button className="bg-primary hover:bg-primary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Add New Tablet
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/tablets')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tablets</CardTitle>
            <Tablet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTablets}</div>
            <p className="text-xs text-muted-foreground">Devices in inventory</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/tablets')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tablets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTablets}</div>
            <p className="text-xs text-muted-foreground">Currently deployed</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/workers')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fieldWorkers}</div>
            <p className="text-xs text-muted-foreground">Registered workers</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/projects')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Ongoing projects</p>
          </CardContent>
        </Card>
        
        {profile?.role === 'super_admin' && (
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/repair-requests')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repair Requests</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.repairRequests}</div>
              <p className="text-xs text-muted-foreground">Pending repairs</p>
            </CardContent>
          </Card>
        )}
      </div>

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