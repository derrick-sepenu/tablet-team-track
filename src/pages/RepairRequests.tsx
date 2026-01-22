import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import RepairRequestModal from "@/components/modals/RepairRequestModal";
import { useRepairRequests } from "@/hooks/useRepairRequests";
import { useAuth } from "@/contexts/AuthContext";
import { exportToCSV, exportToExcel } from "@/utils/exportUtils";
import { 
  Search, 
  Plus,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Download
} from "lucide-react";

const RepairRequests = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { repairRequests, loading, updateRepairRequest, completeRepairRequest } = useRepairRequests();
  const { profile } = useAuth();

  const formatRepairRequestsForExport = () => {
    return filteredRequests.map(request => ({
      'Request ID': request.id.slice(0, 8),
      'Tablet ID': request.tablet?.tablet_id || 'Unknown',
      'Status': request.status.replace('_', ' '),
      'Priority': request.priority,
      'Problem Description': request.problem_description,
      'Requested By': request.requested_by?.full_name || 'Unknown',
      'Requested At': new Date(request.requested_at).toLocaleDateString(),
      'Assigned Technician': request.assigned_technician || 'N/A',
      'Completed At': request.completed_at ? new Date(request.completed_at).toLocaleDateString() : 'N/A',
      'Status Notes': request.status_notes || 'N/A',
    }));
  };

  const handleExportCSV = () => {
    const formattedData = formatRepairRequestsForExport();
    exportToCSV(formattedData, 'damaged_tablets_report');
  };

  const handleExportExcel = () => {
    const formattedData = formatRepairRequestsForExport();
    exportToExcel(formattedData, 'damaged_tablets_report');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'in_progress': return 'bg-info text-info-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'in_progress': return <Wrench className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      default: return <XCircle className="h-3 w-3" />;
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const filteredRequests = repairRequests.filter(request => {
    const matchesSearch = request.problem_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.tablet?.tablet_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requested_by?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleStatusUpdate = async (id: string, status: 'in_progress' | 'completed') => {
    if (status === 'completed') {
      await completeRepairRequest(id, "Repair completed successfully");
    } else {
      await updateRepairRequest(id, { status });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <h1 className="text-2xl font-bold text-foreground">Repair Requests</h1>
              <p className="text-muted-foreground">Manage tablet repair requests and maintenance</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button 
                className="bg-primary hover:bg-primary-hover"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit Repair Request
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description, tablet ID, or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Repair Requests Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Wrench className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          Tablet: {request.tablet?.tablet_id || 'Unknown'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Request ID: {request.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(request.priority)}>
                        {getPriorityIcon(request.priority)}
                        <span className="ml-1">{request.priority}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Problem Description */}
                  <div>
                    <p className="text-sm font-medium mb-1">Problem Description:</p>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      {request.problem_description}
                    </p>
                  </div>

                  {/* Request Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Requested By</p>
                          <p className="font-medium">{request.requested_by?.full_name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Requested At</p>
                          <p className="font-medium">{new Date(request.requested_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {request.assigned_technician && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Technician</p>
                            <p className="font-medium">{request.assigned_technician}</p>
                          </div>
                        </div>
                      )}
                      {request.completed_at && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Completed At</p>
                            <p className="font-medium">{new Date(request.completed_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Notes */}
                  {request.status_notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Status Notes:</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        {request.status_notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {profile?.role === 'super_admin' && request.status !== 'completed' && (
                    <div className="flex gap-2 pt-2">
                      {request.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                        >
                          Start Repair
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleStatusUpdate(request.id, 'completed')}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No repair requests found</p>
                <p className="text-sm text-muted-foreground">
                  {repairRequests.length === 0 
                    ? "No repair requests have been submitted yet."
                    : "Try adjusting your search criteria or filters."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <RepairRequestModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
};

export default RepairRequests;