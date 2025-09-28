import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTablets, Tablet } from '@/hooks/useTablets';
import { useProjects } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';

interface TabletFormProps {
  tablet?: Tablet;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TabletForm: React.FC<TabletFormProps> = ({ tablet, onSuccess, onCancel }) => {
  const { createTablet, updateTablet } = useTablets();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    tablet_id: tablet?.tablet_id || '',
    serial_number: tablet?.serial_number || '',
    model: tablet?.model || '',
    sim_number: tablet?.sim_number || '',
    status: (tablet?.status || 'available') as 'available' | 'assigned' | 'in_repair' | 'lost' | 'returned',
    notes: tablet?.notes || '',
    assigned_project_id: tablet?.assigned_project_id || 'none',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      // Convert "none" values to null for database
      const submitData = {
        ...formData,
        assigned_project_id: formData.assigned_project_id === "none" ? null : formData.assigned_project_id || null,
      };
      
      if (tablet) {
        result = await updateTablet(tablet.id, submitData);
      } else {
        result = await createTablet(submitData);
      }

      if (result.success) {
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tablet_id">Tablet ID</Label>
          <Input
            id="tablet_id"
            value={formData.tablet_id}
            onChange={(e) => handleChange('tablet_id', e.target.value)}
            placeholder="TB-0001"
            required
            disabled={!!tablet} // Don't allow editing tablet ID
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serial_number">Serial Number</Label>
          <Input
            id="serial_number"
            value={formData.serial_number}
            onChange={(e) => handleChange('serial_number', e.target.value)}
            placeholder="SM-X706B123456"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder="Galaxy Tab S8"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sim_number">SIM Number</Label>
          <Input
            id="sim_number"
            value={formData.sim_number}
            onChange={(e) => handleChange('sim_number', e.target.value)}
            placeholder="89001234567890123456"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_repair">In Repair</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes about this tablet..."
          rows={3}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tablet ? 'Update Tablet' : 'Add Tablet'}
        </Button>
      </div>
    </form>
  );
};

export default TabletForm;