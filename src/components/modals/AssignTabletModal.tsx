import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTablets, Tablet } from '@/hooks/useTablets';
import { useFieldWorkers } from '@/hooks/useFieldWorkers';
import { useProjects } from '@/hooks/useProjects';
import { Loader2, Tablet as TabletIcon, User, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AssignTabletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tablet: Tablet;
}

const AssignTabletModal: React.FC<AssignTabletModalProps> = ({ open, onOpenChange, tablet }) => {
  const { assignTablet, updateTablet } = useTablets();
  const { workers } = useFieldWorkers();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(tablet.assigned_project_id || '');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');

  // Filter workers based on selected project - only show workers from that project without a tablet
  const availableWorkers = useMemo(() => {
    if (!selectedProjectId) return [];
    return workers.filter(worker => 
      worker.assigned_project_id === selectedProjectId && 
      worker.is_active &&
      !worker.assigned_tablet_id
    );
  }, [workers, selectedProjectId]);

  // Get current assignment info
  const currentWorker = workers.find(w => w.assigned_tablet_id === tablet.id);
  const currentProject = projects.find(p => p.id === tablet.assigned_project_id);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedWorkerId(''); // Reset worker selection when project changes
  };

  const handleAssign = async () => {
    if (!selectedProjectId || !selectedWorkerId) return;
    
    setLoading(true);
    try {
      const result = await assignTablet(tablet.id, selectedWorkerId, selectedProjectId);
      if (result.success) {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    try {
      // Update tablet to unassigned
      const result = await updateTablet(tablet.id, {
        status: 'available',
        assigned_project_id: null,
        date_assigned: null,
      });
      
      if (result.success) {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedProjectId(tablet.assigned_project_id || '');
    setSelectedWorkerId('');
    onOpenChange(false);
  };

  const isAssigned = tablet.status === 'assigned' && currentWorker;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TabletIcon className="h-5 w-5 text-primary" />
            Assign Tablet
          </DialogTitle>
          <DialogDescription>
            Assign {tablet.tablet_id} to a field worker
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignment Info */}
          {isAssigned && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Current Assignment</p>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{currentWorker.full_name}</span>
              </div>
              {currentProject && (
                <div className="flex items-center gap-2 text-sm">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{currentProject.name}</span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUnassign}
                disabled={loading}
                className="mt-2"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Unassign Tablet
              </Button>
            </div>
          )}

          {/* New Assignment Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker">Field Worker</Label>
              <Select 
                value={selectedWorkerId} 
                onValueChange={setSelectedWorkerId}
                disabled={!selectedProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedProjectId ? "Select a field worker" : "Select a project first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No available workers in this project
                    </div>
                  ) : (
                    availableWorkers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        <div className="flex items-center gap-2">
                          <span>{worker.full_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {worker.staff_id}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedProjectId && availableWorkers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  All active workers in this project already have tablets assigned.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={loading || !selectedProjectId || !selectedWorkerId}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Tablet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTabletModal;
