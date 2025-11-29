import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { 
  Tablet, 
  Users, 
  Wrench,
  FolderOpen,
  CheckCircle,
  Activity,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const StatsWidget = () => {
  const { stats, loading } = useDashboardStats();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Tablets",
      value: stats.totalTablets,
      description: "Devices in inventory",
      icon: Tablet,
      color: "text-primary",
      onClick: () => navigate('/tablets'),
    },
    {
      title: "Available Tablets",
      value: stats.availableTablets,
      description: "Ready to assign",
      icon: CheckCircle,
      color: "text-success",
      onClick: () => navigate('/tablets'),
    },
    {
      title: "Assigned Tablets",
      value: stats.assignedTablets,
      description: "Currently deployed",
      icon: Activity,
      color: "text-status-assigned",
      onClick: () => navigate('/tablets'),
    },
    {
      title: "In Repair",
      value: stats.inRepairTablets,
      description: "Under maintenance",
      icon: Wrench,
      color: "text-warning",
      onClick: () => navigate('/repair-requests'),
    },
    {
      title: "Active Workers",
      value: stats.activeWorkers,
      description: "Field personnel",
      icon: Users,
      color: "text-primary",
      onClick: () => navigate('/workers'),
    },
    {
      title: "Pending Repairs",
      value: stats.pendingRepairRequests,
      description: "Awaiting action",
      icon: AlertCircle,
      color: "text-destructive",
      onClick: () => navigate('/repair-requests'),
    },
    {
      title: "Active Projects",
      value: stats.totalProjects,
      description: "Ongoing projects",
      icon: FolderOpen,
      color: "text-primary",
      onClick: () => navigate('/projects'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-Time Statistics</h2>
          <p className="text-muted-foreground text-sm">
            Live data updates automatically
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50"
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StatsWidget;
