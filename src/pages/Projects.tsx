import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Navigation from "@/components/Navigation";
import ProjectModal from "@/components/modals/ProjectModal";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";
import { useProjects, Project } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Search, 
  Filter, 
  Plus,
  FolderOpen,
  Users,
  Calendar,
  MapPin,
  Tablet,
  Clock,
  Eye,
  Settings,
  Trash2
} from "lucide-react";

// Display type for projects - flexible union type
type DisplayProject = (Project | {
  id: string;
  name: string;
  description?: string;
  data_manager_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}) & {
  // Optional mock properties for display
  status?: string;
  priority?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  assignedWorkers?: string[];
  assignedTablets?: string[];
  totalTasks?: number;
  completedTasks?: number;
  manager?: string;
  budget?: string;
  department?: string;
  location?: string;
};

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const { projects, loading, deleteProject } = useProjects();
  const { profile } = useAuth();

  // Transform real projects to display format
  const realProjectsDisplay: DisplayProject[] = projects.map(project => ({
    ...project,
    status: project.is_active ? 'active' : 'inactive',
    priority: 'medium',
    progress: 0,
    startDate: project.created_at,
    endDate: '',
    assignedWorkers: project.field_workers?.map(fw => fw.full_name) || [],
    assignedTablets: project.tablets?.map(t => t.tablet_id) || [],
    totalTasks: 0,
    completedTasks: 0,
    manager: project.data_manager?.full_name || 'Unassigned',
    budget: 'N/A',
    department: 'N/A',
    location: 'N/A'
  }));

  // Mock project data for demonstration
  const mockProjectsDisplay: DisplayProject[] = [
    {
      id: "PRJ-001",
      name: "Site Survey Project",
      description: "Comprehensive environmental and structural assessment of downtown development sites",
      status: "active",
      priority: "high",
      startDate: "2024-01-15",
      endDate: "2024-04-30",
      progress: 65,
      assignedWorkers: ["John Smith", "Mike Davis"],
      assignedTablets: ["TB-001", "TB-007"],
      location: "Downtown Sites A-E",
      manager: "Dr. Emily Rodriguez",
      totalTasks: 45,
      completedTasks: 29,
      budget: "$125,000",
      department: "Environmental Services",
      data_manager_id: null,
      is_active: true,
      created_at: "2024-01-15T00:00:00.000Z",
      updated_at: "2024-01-15T00:00:00.000Z"
    },
    {
      id: "PRJ-002", 
      name: "Environmental Survey",
      description: "Wildlife habitat assessment and environmental impact study for protected forest areas",
      status: "active",
      priority: "medium",
      startDate: "2024-02-01",
      endDate: "2024-06-15",
      progress: 40,
      assignedWorkers: ["Sarah Johnson", "Lisa Chen"],
      assignedTablets: ["TB-002"],
      location: "Forest Sites B, F, G",
      manager: "Prof. David Chen",
      totalTasks: 32,
      completedTasks: 13,
      budget: "$89,000",
      department: "Environmental Services",
      data_manager_id: null,
      is_active: true,
      created_at: "2024-02-01T00:00:00.000Z",
      updated_at: "2024-02-01T00:00:00.000Z"
    },
    {
      id: "PRJ-003",
      name: "Infrastructure Audit",
      description: "Comprehensive audit and assessment of municipal infrastructure systems",
      status: "active",
      priority: "high",
      startDate: "2024-03-01",
      endDate: "2024-08-30",
      progress: 25,
      assignedWorkers: ["Mike Davis"],
      assignedTablets: ["TB-007"],
      location: "Industrial Zone C",
      manager: "Eng. Robert Wilson",
      totalTasks: 78,
      completedTasks: 19,
      budget: "$200,000",
      department: "Infrastructure",
      data_manager_id: null,
      is_active: true,
      created_at: "2024-03-01T00:00:00.000Z",
      updated_at: "2024-03-01T00:00:00.000Z"
    },
    {
      id: "PRJ-004",
      name: "Quality Control Assessment",
      description: "Quality assurance and control processes evaluation for manufacturing facilities",
      status: "planning",
      priority: "medium",
      startDate: "2024-05-01",
      endDate: "2024-09-30",
      progress: 5,
      assignedWorkers: [],
      assignedTablets: [],
      location: "Manufacturing District",
      manager: "Dr. Jennifer Kim",
      totalTasks: 55,
      completedTasks: 3,
      budget: "$95,000",
      department: "Quality Control",
      data_manager_id: null,
      is_active: true,
      created_at: "2024-05-01T00:00:00.000Z",
      updated_at: "2024-05-01T00:00:00.000Z"
    },
    {
      id: "PRJ-005",
      name: "Safety Compliance Review",
      description: "Workplace safety standards compliance verification and documentation",
      status: "completed",
      priority: "low",
      startDate: "2023-10-01",
      endDate: "2024-01-31",
      progress: 100,
      assignedWorkers: [],
      assignedTablets: [],
      location: "Various Sites",
      manager: "Safety Officer Mark Thompson",
      totalTasks: 28,
      completedTasks: 28,
      budget: "$45,000",
      department: "Safety & Compliance",
      data_manager_id: null,
      is_active: true,
      created_at: "2023-10-01T00:00:00.000Z",
      updated_at: "2024-01-31T00:00:00.000Z"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-active text-success-foreground';
      case 'planning': return 'bg-warning text-warning-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'on-hold': return 'bg-status-inactive text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const handleViewDetails = (project: DisplayProject) => {
    // Find the real project from the projects array if it exists
    const realProject = projects.find(p => p.id === project.id);
    if (realProject) {
      setSelectedProject(realProject);
      setShowDetailsModal(true);
    } else {
      // For mock projects, show basic info
      alert(`Project Details:\nName: ${project.name}\nStatus: ${project.status}\nManager: ${project.manager}\nProgress: ${project.progress}%`);
    }
  };

  const handleManageTeam = (project: DisplayProject) => {
    setEditingProject(project as Project);
    setShowCreateModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
  };

  // Use real projects if available, otherwise show mock data for demo
  const displayProjects: DisplayProject[] = realProjectsDisplay.length > 0 ? realProjectsDisplay : mockProjectsDisplay;
  
  const filteredProjects = displayProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.manager && project.manager.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Project Management</h1>
              <p className="text-muted-foreground">Manage projects and resource assignments</p>
            </div>
            <Button 
              className="bg-primary hover:bg-primary-hover"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects by name, manager, department, or location..."
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

          {/* Projects Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <FolderOpen className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{project.id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(project.status || 'active')}>
                        {project.status || 'active'}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(project.priority || 'medium')}>
                        {project.priority || 'medium'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.completedTasks || 0}/{project.totalTasks || 0} tasks</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                    <div className="text-right text-xs text-muted-foreground">{project.progress || 0}%</div>
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Start Date</p>
                          <p className="font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">End Date</p>
                          <p className="font-medium">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Workers</p>
                          <p className="font-medium">{project.assignedWorkers?.length || 'None'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Tablet className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tablets</p>
                          <p className="font-medium">{project.assignedTablets?.length || 'None'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignments */}
                  {(project.assignedWorkers && project.assignedWorkers.length > 0) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Assigned Team:</p>
                      <div className="flex flex-wrap gap-2">
                        {project.assignedWorkers.map((worker) => (
                          <Badge key={worker} variant="secondary" className="text-xs">
                            {worker}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project Info */}
                  <div className="pt-2 border-t border-border space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manager:</span>
                      <span className="font-medium">{project.manager || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{project.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">{project.budget || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{project.location || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDetails(project)}>
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleManageTeam(project)}>
                      <Settings className="h-3 w-3 mr-1" />
                      Manage Team
                    </Button>
                    {profile?.role === 'super_admin' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Project</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{project.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No projects found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search criteria or create a new project.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <ProjectModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        project={editingProject}
      />
      
      <ProjectDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        project={selectedProject}
      />
    </div>
  );
};

export default Projects;