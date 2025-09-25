import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tablet, 
  Users, 
  FolderOpen, 
  TrendingUp,
  Plus,
  Signal,
  Battery,
  MapPin
} from "lucide-react";

const Dashboard = () => {
  // Mock data - in real app, this would come from your database
  const stats = {
    totalTablets: 48,
    activeTablets: 42,
    maintenanceTablets: 3,
    unassignedTablets: 3,
    totalWorkers: 35,
    activeProjects: 8,
  };

  const recentActivity = [
    {
      id: 1,
      action: "Tablet TB-001 assigned to John Smith",
      project: "Site Survey Project",
      time: "2 minutes ago",
      type: "assignment"
    },
    {
      id: 2,
      action: "Tablet TB-015 reported maintenance issue",
      project: "Quality Control",
      time: "1 hour ago",
      type: "maintenance"
    },
    {
      id: 3,
      action: "Data sync completed for 12 tablets",
      project: "Multiple Projects",
      time: "3 hours ago",
      type: "sync"
    },
    {
      id: 4,
      action: "New worker Sarah Johnson added",
      project: "Environmental Survey",
      time: "1 day ago",
      type: "worker"
    },
  ];

  const criticalAlerts = [
    {
      id: 1,
      tablet: "TB-007",
      issue: "Low battery (8%)",
      worker: "Mike Davis",
      severity: "high"
    },
    {
      id: 2,
      tablet: "TB-023",
      issue: "No signal for 2 hours",
      worker: "Lisa Chen",
      severity: "medium"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your tablet fleet and field operations</p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />
          Add New Tablet
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tablets</CardTitle>
            <Tablet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalTablets}</div>
            <p className="text-xs text-success">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tablets</CardTitle>
            <Signal className="h-4 w-4 text-status-active" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeTablets}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.activeTablets / stats.totalTablets) * 100)}% of total fleet
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalWorkers}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.activeProjects} active projects
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unassignedTablets} tablets unassigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Battery className="h-5 w-5 mr-2 text-warning" />
              Critical Alerts
            </CardTitle>
            <CardDescription>Tablets requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-secondary/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{alert.tablet}</p>
                  <p className="text-sm text-muted-foreground">{alert.issue}</p>
                  <p className="text-xs text-muted-foreground">Assigned to: {alert.worker}</p>
                </div>
                <Badge 
                  variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {alert.severity}
                </Badge>
              </div>
            ))}
            {criticalAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No critical alerts at this time
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your tablet fleet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex-shrink-0">
                    {activity.type === 'assignment' && <Tablet className="h-4 w-4 text-primary mt-0.5" />}
                    {activity.type === 'maintenance' && <Battery className="h-4 w-4 text-warning mt-0.5" />}
                    {activity.type === 'sync' && <Signal className="h-4 w-4 text-success mt-0.5" />}
                    {activity.type === 'worker' && <Users className="h-4 w-4 text-accent-foreground mt-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.project}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;