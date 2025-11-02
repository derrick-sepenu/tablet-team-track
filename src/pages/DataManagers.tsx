import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import DataManagerModal from "@/components/modals/DataManagerModal";
import { 
  Search, 
  Filter, 
  User,
  Tablet,
  FolderOpen,
  Users,
  Calendar,
  Loader2,
  Edit
} from "lucide-react";

interface DataManager {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
  }>;
  tablets_count: number;
  field_workers_count: number;
}

const DataManagers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dataManagers, setDataManagers] = useState<DataManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState<DataManager | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    fetchDataManagers();
  }, []);

  const fetchDataManagers = async () => {
    try {
      setLoading(true);
      
      // First, get user IDs with data_manager role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'data_manager');

      if (roleError) throw roleError;

      const dataManagerUserIds = roleData?.map(r => r.user_id) || [];

      if (dataManagerUserIds.length === 0) {
        setDataManagers([]);
        setLoading(false);
        return;
      }

      // Fetch data managers with their projects
      const { data: managersData, error: managersError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          is_active,
          created_at,
          projects:projects (
            id,
            name,
            description,
            is_active
          )
        `)
        .in('user_id', dataManagerUserIds);

      if (managersError) throw managersError;

      // For each data manager, count their tablets and field workers
      const managersWithCounts = await Promise.all(
        (managersData || []).map(async (manager) => {
          // Count tablets assigned to this manager's projects
          const { count: tabletsCount } = await supabase
            .from('tablets')
            .select('*', { count: 'exact' })
            .in('assigned_project_id', manager.projects?.map(p => p.id) || []);

          // Count field workers assigned to this manager's projects
          const { count: workersCount } = await supabase
            .from('field_workers')
            .select('*', { count: 'exact' })
            .in('assigned_project_id', manager.projects?.map(p => p.id) || []);

          return {
            ...manager,
            tablets_count: tabletsCount || 0,
            field_workers_count: workersCount || 0,
            projects: manager.projects || []
          };
        })
      );

      setDataManagers(managersWithCounts);
    } catch (error) {
      console.error('Error fetching data managers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-status-active text-success-foreground' 
      : 'bg-status-inactive text-white';
  };

  const filteredManagers = dataManagers.filter(manager =>
    manager.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.projects.some(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleEditManager = (manager: DataManager) => {
    setSelectedManager(manager);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedManager(null);
    fetchDataManagers();
  };

  if (profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to view this page.</p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Data Managers</h1>
              <p className="text-muted-foreground">Overview of data managers and their resource assignments</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data managers by name, email, or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Data Managers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredManagers.map((manager) => (
              <Card key={manager.id} className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{manager.full_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{manager.email}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(manager.is_active)}>
                      {manager.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <FolderOpen className="h-4 w-4 text-primary mr-1" />
                        <span className="text-lg font-semibold text-primary">{manager.projects.length}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <Tablet className="h-4 w-4 text-secondary-foreground mr-1" />
                        <span className="text-lg font-semibold text-secondary-foreground">{manager.tablets_count}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Tablets</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <Users className="h-4 w-4 text-foreground mr-1" />
                        <span className="text-lg font-semibold text-foreground">{manager.field_workers_count}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Workers</p>
                    </div>
                  </div>

                  {/* Projects List */}
                  {manager.projects.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Assigned Projects:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {manager.projects.map((project) => (
                          <div key={project.id} className="flex items-center justify-between text-xs">
                            <span className="font-medium truncate">{project.name}</span>
                            <Badge variant={project.is_active ? "default" : "secondary"} className="text-xs">
                              {project.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic text-center py-2">
                      No projects assigned
                    </div>
                  )}

                  {/* Manager Info and Actions */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-muted-foreground">Joined: </span>
                        <span className="font-medium">{new Date(manager.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleEditManager(manager)}
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Manage Assignments
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredManagers.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No data managers found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {selectedManager && (
        <DataManagerModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          manager={selectedManager}
          onSuccess={handleModalClose}
        />
      )}
    </div>
  );
};

export default DataManagers;