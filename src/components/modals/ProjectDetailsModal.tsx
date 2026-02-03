import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Project } from '@/hooks/useProjects';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';
import { Download, FileSpreadsheet, Tablet, Users, User } from 'lucide-react';

interface ProjectDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ 
  open, 
  onOpenChange, 
  project 
}) => {
  if (!project) return null;

  const tablets = project.tablets || [];
  const fieldWorkers = project.field_workers || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-status-active text-success-foreground';
      case 'assigned': return 'bg-primary text-primary-foreground';
      case 'in_repair': return 'bg-warning text-warning-foreground';
      case 'lost': return 'bg-destructive text-destructive-foreground';
      case 'returned': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatTabletsForExport = () => {
    return tablets.map(tablet => ({
      'Tablet ID': tablet.tablet_id,
      'Model': tablet.model,
      'Project': project.name,
      'Data Manager': project.data_manager?.full_name || 'Unassigned',
    }));
  };

  const handleExportCSV = () => {
    if (tablets.length === 0) return;
    exportToCSV(formatTabletsForExport(), `${project.name.replace(/\s+/g, '_')}_tablets`);
  };

  const handleExportExcel = () => {
    if (tablets.length === 0) return;
    exportToExcel(formatTabletsForExport(), `${project.name.replace(/\s+/g, '_')}_tablets`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{project.name}</span>
            <Badge variant={project.is_active ? "default" : "secondary"}>
              {project.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Data Manager</p>
                  <p className="font-medium">{project.data_manager?.full_name || 'Unassigned'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <Tablet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tablets Assigned</p>
                  <p className="font-medium">{tablets.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Field Workers</p>
                  <p className="font-medium">{fieldWorkers.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {project.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
              <p className="text-sm">{project.description}</p>
            </div>
          )}

          {/* Tablets Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tablet className="h-5 w-5" />
                Assigned Tablets
              </h3>
              {tablets.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              )}
            </div>

            {tablets.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tablet ID</TableHead>
                      <TableHead>Model</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tablets.map((tablet) => (
                      <TableRow key={tablet.id}>
                        <TableCell className="font-medium">{tablet.tablet_id}</TableCell>
                        <TableCell>{tablet.model}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Tablet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tablets assigned to this project</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Field Workers Section */}
          {fieldWorkers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Field Workers
              </h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff ID</TableHead>
                      <TableHead>Full Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldWorkers.map((worker) => (
                      <TableRow key={worker.id}>
                        <TableCell className="font-medium">{worker.staff_id}</TableCell>
                        <TableCell>{worker.full_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;
