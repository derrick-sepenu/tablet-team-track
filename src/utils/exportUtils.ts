import { Tablet } from '@/hooks/useTablets';
import { FieldWorker } from '@/hooks/useFieldWorkers';
import { Project } from '@/hooks/useProjects';
import { RepairRequest } from '@/hooks/useRepairRequests';
import { InventoryItem } from '@/hooks/useInventoryItems';

// CSV export utility
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle nested objects and arrays
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape commas and quotes in strings
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

// Excel export utility (simplified - creates CSV with .xlsx extension)
export const exportToExcel = (data: any[], filename: string) => {
  exportToCSV(data, `${filename}.xlsx`);
};

// File download helper
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Format data for export
export const formatTabletsForExport = (tablets: Tablet[]) => {
  return tablets.map(tablet => ({
    'Tablet ID': tablet.tablet_id,
    'Serial Number': tablet.serial_number,
    'Model': tablet.model,
    'SIM Number': tablet.sim_number || '',
    'Status': tablet.status,
    'Assigned Project': tablet.project?.name || '',
    'Data Manager': tablet.project?.data_manager?.full_name || '',
    'Assigned Worker': tablet.field_worker?.full_name || '',
    'Date Assigned': tablet.date_assigned ? new Date(tablet.date_assigned).toLocaleDateString() : '',
    'Notes': tablet.notes || '',
    'Created At': new Date(tablet.created_at).toLocaleDateString(),
  }));
};

export const formatWorkersForExport = (workers: FieldWorker[]) => {
  return workers.map(worker => ({
    'Staff ID': worker.staff_id,
    'Full Name': worker.full_name,
    'Assigned Tablet': worker.tablet?.tablet_id || '',
    'Assigned Project': worker.project?.name || '',
    'Status': worker.is_active ? 'Active' : 'Inactive',
    'Assignment Date': worker.assignment_date ? new Date(worker.assignment_date).toLocaleDateString() : '',
    'Created At': new Date(worker.created_at).toLocaleDateString(),
  }));
};

export const formatProjectsForExport = (projects: Project[]) => {
  return projects.map(project => ({
    'Project Name': project.name,
    'Description': project.description || '',
    'Data Manager': project.data_manager?.full_name || '',
    'Status': project.is_active ? 'Active' : 'Inactive',
    'Tablets Count': project.tablets?.length || 0,
    'Workers Count': project.field_workers?.length || 0,
    'Created At': new Date(project.created_at).toLocaleDateString(),
  }));
};

export const formatRepairRequestsForExport = (requests: RepairRequest[]) => {
  return requests.map(request => ({
    'Request ID': request.id,
    'Tablet ID': request.tablet?.tablet_id || '',
    'Tablet Model': request.tablet?.model || '',
    'Requested By': request.requested_by?.full_name || '',
    'Problem Description': request.problem_description,
    'Priority': request.priority,
    'Status': request.status,
    'Assigned Technician': request.assigned_technician || '',
    'Status Notes': request.status_notes || '',
    'Requested At': new Date(request.requested_at).toLocaleDateString(),
    'Completed At': request.completed_at ? new Date(request.completed_at).toLocaleDateString() : '',
  }));
};

export const formatInventoryItemsForExport = (items: InventoryItem[]) => {
  return items.map(item => ({
    'Item Name': item.item_name,
    'Category': item.category,
    'Brand': item.brand || '',
    'Model': item.model || '',
    'Serial Number': item.serial_number || '',
    'Asset Tag': item.asset_tag || '',
    'Condition': item.condition,
    'Quantity': item.quantity,
    'Location': item.location || '',
    'Assigned To': item.assigned_to || '',
    'Purchase Date': item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : '',
    'Purchase Price': item.purchase_price || '',
    'Warranty Expiry': item.warranty_expiry ? new Date(item.warranty_expiry).toLocaleDateString() : '',
    'Notes': item.notes || '',
    'Status': item.is_active ? 'Active' : 'Inactive',
    'Created At': new Date(item.created_at).toLocaleDateString(),
  }));
};