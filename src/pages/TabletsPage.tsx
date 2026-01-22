import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import TabletModal from "@/components/modals/TabletModal";
import RepairRequestModal from "@/components/modals/RepairRequestModal";
import BulkTabletImportModal from "@/components/modals/BulkTabletImportModal";
import AssignTabletModal from "@/components/modals/AssignTabletModal";
import { useTablets, Tablet } from "@/hooks/useTablets";
import { useAuth } from "@/contexts/AuthContext";
import { exportToCSV, exportToExcel, formatTabletsForExport } from "@/utils/exportUtils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Search, 
  Filter, 
  Plus,
  Tablet as TabletIcon,
  MapPin,
  User,
  Edit,
  Wrench,
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
  UserPlus
} from "lucide-react";

const TabletsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tabletModalOpen, setTabletModalOpen] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingTablet, setEditingTablet] = useState<Tablet | undefined>();
  const [assigningTablet, setAssigningTablet] = useState<Tablet | undefined>();
  const [repairTabletId, setRepairTabletId] = useState<string | undefined>();
  
  const { tablets, loading, deleteTablet } = useTablets();
  const { profile } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-status-active text-success-foreground';
      case 'available': return 'bg-secondary text-secondary-foreground';
      case 'in_repair': return 'bg-status-maintenance text-warning-foreground';
      case 'lost': return 'bg-destructive text-destructive-foreground';
      case 'returned': return 'bg-status-inactive text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getSignalBars = (strength: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-1 h-3 rounded-sm ${
          i < strength ? 'bg-status-active' : 'bg-muted'
        }`}
      />
    ));
  };

  const filteredTablets = tablets.filter(tablet =>
    tablet.tablet_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tablet.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tablet.field_worker?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tablet.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTablet = () => {
    setEditingTablet(undefined);
    setTabletModalOpen(true);
  };

  const handleEditTablet = (tablet: Tablet) => {
    setEditingTablet(tablet);
    setTabletModalOpen(true);
  };

  const handleAssignTablet = (tablet: Tablet) => {
    setAssigningTablet(tablet);
    setAssignModalOpen(true);
  };

  const handleRepairRequest = (tabletId: string) => {
    setRepairTabletId(tabletId);
    setRepairModalOpen(true);
  };

  const handleDeleteTablet = async (tabletId: string) => {
    await deleteTablet(tabletId);
  };

  const handleExportCSV = () => {
    const formattedData = formatTabletsForExport(filteredTablets);
    exportToCSV(formattedData, 'tablets_report');
  };

  const handleExportExcel = () => {
    const formattedData = formatTabletsForExport(filteredTablets);
    exportToExcel(formattedData, 'tablets_report');
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
              <h1 className="text-2xl font-bold text-foreground">Tablet Management</h1>
              <p className="text-muted-foreground">Manage your Samsung tablet fleet</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={handleAddTablet} className="bg-primary hover:bg-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                Add New Tablet
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tablets by ID, model, worker, or project..."
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

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTablets.map((tablet) => (
              <Card key={tablet.id} className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <TabletIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-semibold">{tablet.tablet_id}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(tablet.status)}>
                      {tablet.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{tablet.model}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Assignment Info */}
                  {tablet.field_worker ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{tablet.field_worker.full_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{tablet.project?.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      Unassigned
                    </div>
                  )}

                  {/* Device Info */}
                  <div className="pt-2 border-t border-border space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Serial:</span>
                      <span className="font-mono">{tablet.serial_number}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>SIM:</span>
                      <span className="font-mono">{tablet.sim_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Date Assigned:</span>
                      <span>{tablet.date_assigned ? new Date(tablet.date_assigned).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAssignTablet(tablet)}
                      disabled={tablet.status === 'in_repair' || tablet.status === 'lost'}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditTablet(tablet)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRepairRequest(tablet.id)}
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Repair
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tablet</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete tablet "{tablet.tablet_id}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTablet(tablet.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTablets.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-8">
                <TabletIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No tablets found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search criteria or add a new tablet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modals */}
        <TabletModal 
          open={tabletModalOpen}
          onOpenChange={setTabletModalOpen}
          tablet={editingTablet}
        />
        
        <RepairRequestModal
          open={repairModalOpen}
          onOpenChange={setRepairModalOpen}
          preselectedTabletId={repairTabletId}
        />

        <BulkTabletImportModal
          open={bulkImportOpen}
          onOpenChange={setBulkImportOpen}
        />

        {assigningTablet && (
          <AssignTabletModal
            open={assignModalOpen}
            onOpenChange={setAssignModalOpen}
            tablet={assigningTablet}
          />
        )}
      </main>
    </div>
  );
};

export default TabletsPage;