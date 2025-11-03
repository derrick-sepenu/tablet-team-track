import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRepairRequests } from '@/hooks/useRepairRequests';
import { useTablets } from '@/hooks/useTablets';
import { Loader2 } from 'lucide-react';

interface RepairRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedTabletId?: string;
}

const RepairRequestForm: React.FC<RepairRequestFormProps> = ({ 
  onSuccess, 
  onCancel, 
  preselectedTabletId 
}) => {
  const { createRepairRequest } = useRepairRequests();
  const { tablets } = useTablets();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    tablet_id: preselectedTabletId || '',
    problem_description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  // Filter tablets that are assigned (most likely to need repair)
  const assignedTablets = tablets.filter(tablet => 
    tablet.status === 'assigned' || tablet.status === 'in_repair'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createRepairRequest(formData);
      if (result.success) {
        // Small delay to ensure state updates before modal closes
        setTimeout(() => onSuccess?.(), 100);
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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tablet_id">Tablet</Label>
          <Select 
            value={formData.tablet_id} 
            onValueChange={(value) => handleChange('tablet_id', value)}
            disabled={!!preselectedTabletId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tablet that needs repair" />
            </SelectTrigger>
            <SelectContent>
              {assignedTablets.map((tablet) => (
                <SelectItem key={tablet.id} value={tablet.id}>
                  {tablet.tablet_id} - {tablet.model} 
                  {tablet.field_worker && ` (${tablet.field_worker.full_name})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority Level</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => handleChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem_description">Problem Description</Label>
          <Textarea
            id="problem_description"
            value={formData.problem_description}
            onChange={(e) => handleChange('problem_description', e.target.value)}
            placeholder="Describe the issue with the tablet..."
            rows={4}
            maxLength={5000}
            required
          />
          <p className="text-xs text-muted-foreground">
            {formData.problem_description.length}/5000 characters
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Repair Request
        </Button>
      </div>
    </form>
  );
};

export default RepairRequestForm;