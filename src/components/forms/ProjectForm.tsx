import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, Project } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  project?: Project;
}

interface DataManager {
  id: string;
  full_name: string;
  email: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSuccess, onCancel, project }) => {
  const { createProject, updateProject } = useProjects();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataManagers, setDataManagers] = useState<DataManager[]>([]);
  
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    data_manager_id: project?.data_manager_id || 'none',
    is_active: project?.is_active ?? true,
  });

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchDataManagers();
    }
  }, [profile]);

  const fetchDataManagers = async () => {
    try {
      // Fetch users with data_manager role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'data_manager');

      if (roleError) throw roleError;

      const dataManagerUserIds = roleData?.map(r => r.user_id) || [];

      // Fetch profiles for data managers
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('user_id', dataManagerUserIds)
        .eq('is_active', true);

      if (error) throw error;
      setDataManagers(data || []);
    } catch (error) {
      console.error('Error fetching data managers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert "none" values to null for database
      const submitData = {
        ...formData,
        data_manager_id: formData.data_manager_id === "none" ? null : formData.data_manager_id || null,
      };

      let result;
      if (project) {
        result = await updateProject(project.id, submitData);
      } else {
        result = await createProject(submitData);
      }

      if (result.success) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error submitting project form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter project name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter project description"
          rows={3}
        />
      </div>

      {profile?.role === 'super_admin' && (
        <div>
          <Label htmlFor="data_manager_id">Data Manager</Label>
          <Select value={formData.data_manager_id} onValueChange={(value) => setFormData(prev => ({ ...prev, data_manager_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select data manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No manager assigned</SelectItem>
              {dataManagers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.full_name} ({manager.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
          className="rounded border-gray-300"
        />
        <Label htmlFor="is_active">Project is active</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;