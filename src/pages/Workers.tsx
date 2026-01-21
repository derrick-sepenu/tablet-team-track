import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import FieldWorkerModal from "@/components/modals/FieldWorkerModal";
import BulkFieldWorkerImportModal from "@/components/modals/BulkFieldWorkerImportModal";
import { useFieldWorkers, FieldWorker } from "@/hooks/useFieldWorkers";
import { useAuth } from "@/contexts/AuthContext";
import { exportToCSV, exportToExcel, formatWorkersForExport } from "@/utils/exportUtils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Search, 
  Filter, 
  Plus,
  User,
  Tablet,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Edit,
  FileText,
  Download,
  Loader2,
  Trash2,
  Upload
} from "lucide-react";

const Workers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<FieldWorker | undefined>();
  
  const { workers, loading, deleteWorker } = useFieldWorkers();
  const { profile } = useAuth();

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-status-active text-success-foreground' 
      : 'bg-status-inactive text-white';
  };

  const filteredWorkers = workers.filter(worker =>
    worker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.staff_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddWorker = () => {
    setEditingWorker(undefined);
    setWorkerModalOpen(true);
  };

  const handleEditWorker = (worker: FieldWorker) => {
    setEditingWorker(worker);
    setWorkerModalOpen(true);
  };

  const handleDeleteWorker = async (workerId: string) => {
    await deleteWorker(workerId);
  };

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
              <h1 className="text-2xl font-bold text-foreground">Field Workers</h1>
              <p className="text-muted-foreground">Manage your field workforce and assignments</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => exportToCSV(formatWorkersForExport(filteredWorkers), 'field_workers_report')}>
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => exportToExcel(formatWorkersForExport(filteredWorkers), 'field_workers_report')}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={() => setBulkImportModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={handleAddWorker} className="bg-primary hover:bg-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                Add New Worker
              </Button>
            </div>
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
                        <CardTitle className="text-lg font-semibold">{worker.full_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{worker.staff_id}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(worker.is_active)}>
                      {worker.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Assignment Info */}
                  {worker.tablet ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Tablet className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Assigned: {worker.tablet.tablet_id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{worker.project?.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No tablet assigned
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditWorker(worker)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
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
                            <AlertDialogTitle>Delete Field Worker</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{worker.full_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteWorker(worker.id)} className="bg-destructive hover:bg-destructive/90">
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

      {/* Modals */}
      <FieldWorkerModal 
        open={workerModalOpen}
        onOpenChange={setWorkerModalOpen}
        worker={editingWorker}
      />
      <BulkFieldWorkerImportModal
        open={bulkImportModalOpen}
        onOpenChange={setBulkImportModalOpen}
      />
    </div>
  );
};

export default Workers;