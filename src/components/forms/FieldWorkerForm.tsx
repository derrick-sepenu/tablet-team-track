import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldWorkers, FieldWorker } from '@/hooks/useFieldWorkers';
import { useProjects } from '@/hooks/useProjects';
import { useTablets } from '@/hooks/useTablets';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface FieldWorkerFormProps {
  worker?: FieldWorker;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FieldWorkerForm: React.FC<FieldWorkerFormProps> = ({ worker, onSuccess, onCancel }) => {
  const { createWorker, updateWorker } = useFieldWorkers();
  const { projects } = useProjects();
  const { tablets } = useTablets();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    staff_id: worker?.staff_id || '',
    full_name: worker?.full_name || '',
    assigned_project_id: worker?.assigned_project_id || 'none',
    assigned_tablet_id: worker?.assigned_tablet_id || 'none',
    is_active: worker?.is_active ?? true,
  });

  // Filter tablets that are available or currently assigned to this worker
  const availableTablets = tablets.filter(tablet => 
    tablet.status === 'available' || tablet.id === worker?.assigned_tablet_id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate staff code
    const staffCode = formData.staff_id.toUpperCase().trim();
    if (!/^[A-Z]{2}$/.test(staffCode)) {
      alert('Staff Code must be exactly 2 uppercase letters (e.g., AB, CD)');
      return;
    }

    // Check uniqueness within the same project
    if (formData.assigned_project_id && formData.assigned_project_id !== 'none') {
      const { data: existingWorkers } = await supabase
        .from('field_workers')
        .select('id, staff_id')
        .eq('assigned_project_id', formData.assigned_project_id)
        .eq('staff_id', staffCode);

      if (existingWorkers && existingWorkers.length > 0) {
        // If editing, check if it's a different worker
        if (!worker || existingWorkers.some(w => w.id !== worker.id)) {
          alert(`Staff Code "${staffCode}" is already used in this project. Please use a different code.`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Convert "none" values to null for database
      const submitData = {
        ...formData,
        staff_id: staffCode,
        assigned_project_id: formData.assigned_project_id === "none" ? null : formData.assigned_project_id || null,
        assigned_tablet_id: formData.assigned_tablet_id === "none" ? null : formData.assigned_tablet_id || null,
      };
      
      // Handle tablet status updates
      const oldTabletId = worker?.assigned_tablet_id;
      const newTabletId = submitData.assigned_tablet_id;
      
      // If tablet assignment changed, update tablet statuses
      if (oldTabletId !== newTabletId) {
        // Reset old tablet to available
        if (oldTabletId) {
          await supabase
            .from('tablets')
            .update({ 
              status: 'available',
              assigned_project_id: null,
              date_assigned: null
            })
            .eq('id', oldTabletId);
        }
        
        // Update new tablet to assigned
        if (newTabletId) {
          await supabase
            .from('tablets')
            .update({ 
              status: 'assigned',
              assigned_project_id: submitData.assigned_project_id,
              date_assigned: new Date().toISOString()
            })
            .eq('id', newTabletId);
        }
      }
      
      // Update/create field worker
      let result;
      if (worker) {
        result = await updateWorker(worker.id, submitData);
      } else {
        result = await createWorker(submitData);
      }

      if (result.success) {
        // Small delay to ensure state updates before modal closes
        setTimeout(() => onSuccess?.(), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="staff_id">Staff Code</Label>
          <Input
            id="staff_id"
            value={formData.staff_id}
            onChange={(e) => handleChange('staff_id', e.target.value.toUpperCase())}
            placeholder="AB"
            maxLength={2}
            required
            className="uppercase"
          />
          <p className="text-xs text-muted-foreground">2 letters (unique per project)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="John Smith"
            maxLength={100}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_project_id">Assigned Project</Label>
          <Select 
            value={formData.assigned_project_id} 
            onValueChange={(value) => handleChange('assigned_project_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project assigned</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_tablet_id">Assigned Tablet</Label>
          <Select 
            value={formData.assigned_tablet_id} 
            onValueChange={(value) => handleChange('assigned_tablet_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tablet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No tablet assigned</SelectItem>
              {availableTablets.map((tablet) => (
                <SelectItem key={tablet.id} value={tablet.id}>
                  {tablet.tablet_id} - {tablet.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Status</Label>
          <Select 
            value={formData.is_active.toString()} 
            onValueChange={(value) => handleChange('is_active', value === 'true')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {worker ? 'Update Worker' : 'Add Worker'}
        </Button>
      </div>
    </form>
  );
};

export default FieldWorkerForm;