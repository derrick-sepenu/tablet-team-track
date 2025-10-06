import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FolderOpen, Tablet, Users } from "lucide-react";

interface DataManager {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
}

interface DataManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager: DataManager;
  onSuccess?: () => void;
}

interface Project {
  id: string;
  name: string;
  is_active: boolean;
  data_manager_id: string | null;
}

interface TabletItem {
  id: string;
  tablet_id: string;
  model: string;
  status: string;
  assigned_project_id: string | null;
}

interface FieldWorker {
  id: string;
  full_name: string;
  staff_id: string;
  assigned_project_id: string | null;
  is_active: boolean;
}

const DataManagerModal: React.FC<DataManagerModalProps> = ({ 
  open, 
  onOpenChange, 
  manager,
  onSuccess 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tablets, setTablets] = useState<TabletItem[]>([]);
  const [workers, setWorkers] = useState<FieldWorker[]>([]);
  
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [projectTablets, setProjectTablets] = useState<Map<string, Set<string>>>(new Map());
  const [projectWorkers, setProjectWorkers] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, manager.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Get projects assigned to this manager
      const managerProjects = (projectsData || [])
        .filter(p => p.data_manager_id === manager.id)
        .map(p => p.id);
      setSelectedProjects(new Set(managerProjects));

      // Fetch all tablets
      const { data: tabletsData, error: tabletsError } = await supabase
        .from('tablets')
        .select('*')
        .order('tablet_id');
      
      if (tabletsError) throw tabletsError;
      setTablets(tabletsData || []);

      // Fetch all field workers
      const { data: workersData, error: workersError } = await supabase
        .from('field_workers')
        .select('*')
        .order('full_name');
      
      if (workersError) throw workersError;
      setWorkers(workersData || []);

      // Initialize project-tablet mappings
      const tabletMap = new Map<string, Set<string>>();
      (tabletsData || []).forEach(tablet => {
        if (tablet.assigned_project_id && managerProjects.includes(tablet.assigned_project_id)) {
          if (!tabletMap.has(tablet.assigned_project_id)) {
            tabletMap.set(tablet.assigned_project_id, new Set());
          }
          tabletMap.get(tablet.assigned_project_id)!.add(tablet.id);
        }
      });
      setProjectTablets(tabletMap);

      // Initialize project-worker mappings
      const workerMap = new Map<string, Set<string>>();
      (workersData || []).forEach(worker => {
        if (worker.assigned_project_id && managerProjects.includes(worker.assigned_project_id)) {
          if (!workerMap.has(worker.assigned_project_id)) {
            workerMap.set(worker.assigned_project_id, new Set());
          }
          workerMap.get(worker.assigned_project_id)!.add(worker.id);
        }
      });
      setProjectWorkers(workerMap);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
        // Remove all tablets and workers from this project
        setProjectTablets(prev => {
          const newMap = new Map(prev);
          newMap.delete(projectId);
          return newMap;
        });
        setProjectWorkers(prev => {
          const newMap = new Map(prev);
          newMap.delete(projectId);
          return newMap;
        });
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleTabletToggle = (projectId: string, tabletId: string) => {
    setProjectTablets(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(projectId)) {
        newMap.set(projectId, new Set());
      }
      const tablets = newMap.get(projectId)!;
      if (tablets.has(tabletId)) {
        tablets.delete(tabletId);
      } else {
        tablets.add(tabletId);
      }
      return newMap;
    });
  };

  const handleWorkerToggle = (projectId: string, workerId: string) => {
    setProjectWorkers(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(projectId)) {
        newMap.set(projectId, new Set());
      }
      const workers = newMap.get(projectId)!;
      if (workers.has(workerId)) {
        workers.delete(workerId);
      } else {
        workers.add(workerId);
      }
      return newMap;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update projects
      const projectUpdates = projects.map(async (project) => {
        const shouldBeAssigned = selectedProjects.has(project.id);
        const isAssigned = project.data_manager_id === manager.id;
        
        if (shouldBeAssigned !== isAssigned) {
          return supabase
            .from('projects')
            .update({ data_manager_id: shouldBeAssigned ? manager.id : null })
            .eq('id', project.id);
        }
      });

      await Promise.all(projectUpdates.filter(Boolean));

      // Update tablets
      const tabletUpdates = tablets.map(async (tablet) => {
        // Check if this tablet should be assigned to any of the manager's projects
        let newProjectId: string | null = null;
        
        for (const [projectId, tabletSet] of projectTablets.entries()) {
          if (selectedProjects.has(projectId) && tabletSet.has(tablet.id)) {
            newProjectId = projectId;
            break;
          }
        }

        if (tablet.assigned_project_id !== newProjectId) {
          return supabase
            .from('tablets')
            .update({ assigned_project_id: newProjectId })
            .eq('id', tablet.id);
        }
      });

      await Promise.all(tabletUpdates.filter(Boolean));

      // Update workers
      const workerUpdates = workers.map(async (worker) => {
        let newProjectId: string | null = null;
        
        for (const [projectId, workerSet] of projectWorkers.entries()) {
          if (selectedProjects.has(projectId) && workerSet.has(worker.id)) {
            newProjectId = projectId;
            break;
          }
        }

        if (worker.assigned_project_id !== newProjectId) {
          return supabase
            .from('field_workers')
            .update({ assigned_project_id: newProjectId })
            .eq('id', worker.id);
        }
      });

      await Promise.all(workerUpdates.filter(Boolean));

      toast({
        title: "Success",
        description: "Assignments updated successfully",
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving assignments:', error);
      toast({
        title: "Error",
        description: "Failed to save assignments",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getManagerProjects = () => projects.filter(p => selectedProjects.has(p.id));
  const getAvailableTablets = () => tablets.filter(t => !t.assigned_project_id || 
    (t.assigned_project_id && selectedProjects.has(t.assigned_project_id)));
  const getAvailableWorkers = () => workers.filter(w => !w.assigned_project_id || 
    (w.assigned_project_id && selectedProjects.has(w.assigned_project_id)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Assignments - {manager.full_name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="projects">
                <FolderOpen className="h-4 w-4 mr-2" />
                Projects ({selectedProjects.size})
              </TabsTrigger>
              <TabsTrigger value="tablets">
                <Tablet className="h-4 w-4 mr-2" />
                Tablets
              </TabsTrigger>
              <TabsTrigger value="workers">
                <Users className="h-4 w-4 mr-2" />
                Workers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Select projects to assign to this data manager
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedProjects.has(project.id)}
                        onCheckedChange={() => handleProjectToggle(project.id)}
                      />
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.data_manager_id && project.data_manager_id !== manager.id
                            ? 'Assigned to another manager'
                            : 'Available'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={project.is_active ? "default" : "secondary"}>
                      {project.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tablets" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Assign tablets to the data manager's projects
              </div>
              {getManagerProjects().map((project) => (
                <div key={project.id} className="space-y-2">
                  <h3 className="font-semibold text-sm">{project.name}</h3>
                  <div className="space-y-2 pl-4 max-h-64 overflow-y-auto">
                    {getAvailableTablets()
                      .filter(t => !t.assigned_project_id || t.assigned_project_id === project.id)
                      .map((tablet) => (
                        <div
                          key={tablet.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-accent"
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={projectTablets.get(project.id)?.has(tablet.id) || false}
                              onCheckedChange={() => handleTabletToggle(project.id, tablet.id)}
                            />
                            <div>
                              <p className="font-medium text-sm">{tablet.tablet_id}</p>
                              <p className="text-xs text-muted-foreground">{tablet.model}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {tablet.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              {getManagerProjects().length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No projects assigned. Assign projects first.
                </p>
              )}
            </TabsContent>

            <TabsContent value="workers" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Assign field workers to the data manager's projects
              </div>
              {getManagerProjects().map((project) => (
                <div key={project.id} className="space-y-2">
                  <h3 className="font-semibold text-sm">{project.name}</h3>
                  <div className="space-y-2 pl-4 max-h-64 overflow-y-auto">
                    {getAvailableWorkers()
                      .filter(w => !w.assigned_project_id || w.assigned_project_id === project.id)
                      .map((worker) => (
                        <div
                          key={worker.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-accent"
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={projectWorkers.get(project.id)?.has(worker.id) || false}
                              onCheckedChange={() => handleWorkerToggle(project.id, worker.id)}
                            />
                            <div>
                              <p className="font-medium text-sm">{worker.full_name}</p>
                              <p className="text-xs text-muted-foreground">{worker.staff_id}</p>
                            </div>
                          </div>
                          <Badge variant={worker.is_active ? "default" : "secondary"} className="text-xs">
                            {worker.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              {getManagerProjects().length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No projects assigned. Assign projects first.
                </p>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Assignments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataManagerModal;
