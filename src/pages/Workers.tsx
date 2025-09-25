import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { 
  Search, 
  Filter, 
  Plus,
  User,
  Tablet,
  MapPin,
  Calendar,
  Phone,
  Mail
} from "lucide-react";

const Workers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock worker data
  const workers = [
    {
      id: "W-001",
      name: "John Smith",
      email: "john.smith@company.com",
      phone: "+1 (555) 123-4567",
      department: "Environmental Services",
      position: "Field Technician",
      assignedTablet: "TB-001",
      currentProject: "Site Survey Project",
      location: "Downtown Site A",
      status: "active",
      joinDate: "2022-03-15",
      totalProjects: 12,
      lastActivity: "2 hours ago"
    },
    {
      id: "W-002",
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      phone: "+1 (555) 234-5678",
      department: "Quality Control",
      position: "Senior Inspector",
      assignedTablet: "TB-002",
      currentProject: "Environmental Survey",
      location: "Forest Site B",
      status: "active",
      joinDate: "2021-11-08",
      totalProjects: 18,
      lastActivity: "1 hour ago"
    },
    {
      id: "W-003",
      name: "Mike Davis",
      email: "mike.davis@company.com",
      phone: "+1 (555) 345-6789",
      department: "Infrastructure",
      position: "Field Engineer",
      assignedTablet: "TB-007",
      currentProject: "Infrastructure Audit",
      location: "Industrial Zone C",
      status: "active",
      totalProjects: 8,
      joinDate: "2023-01-22",
      lastActivity: "30 minutes ago"
    },
    {
      id: "W-004",
      name: "Lisa Chen",
      email: "lisa.chen@company.com",
      phone: "+1 (555) 456-7890",
      department: "Environmental Services",
      position: "Data Specialist",
      assignedTablet: null,
      currentProject: null,
      location: "Office",
      status: "office",
      joinDate: "2022-07-12",
      totalProjects: 15,
      lastActivity: "5 minutes ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-active text-success-foreground';
      case 'office': return 'bg-secondary text-secondary-foreground';
      case 'inactive': return 'bg-status-inactive text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.currentProject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Field Workers</h1>
              <p className="text-muted-foreground">Manage your field workforce and assignments</p>
            </div>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add New Worker
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workers by name, email, department, or project..."
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

          {/* Workers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredWorkers.map((worker) => (
              <Card key={worker.id} className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{worker.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{worker.position}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(worker.status)}>
                      {worker.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{worker.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{worker.phone}</span>
                    </div>
                  </div>

                  {/* Assignment Info */}
                  {worker.assignedTablet ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Tablet className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Assigned: {worker.assignedTablet}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{worker.currentProject}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Location: {worker.location}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No tablet assigned
                    </div>
                  )}

                  {/* Worker Stats */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{worker.department}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Projects Completed:</span>
                      <span className="font-medium">{worker.totalProjects}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Join Date:</span>
                      <span className="font-medium">{new Date(worker.joinDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Activity:</span>
                      <span className="font-medium">{worker.lastActivity}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      {worker.assignedTablet ? 'Reassign' : 'Assign Tablet'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWorkers.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No workers found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search criteria or add a new worker.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Workers;