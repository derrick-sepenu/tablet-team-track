import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useFieldWorkers } from '@/hooks/useFieldWorkers';
import { useProjects } from '@/hooks/useProjects';
import { useTablets } from '@/hooks/useTablets';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Download,
  ArrowRight,
  ArrowLeft,
  Users,
  FolderOpen,
  Tablet,
  Eye
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface BulkFieldWorkerImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportRow {
  staff_id: string;
  full_name: string;
  project_name?: string;
  tablet_id?: string;
  is_active?: string;
}

interface ValidationResult {
  row: number;
  data: ImportRow;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

const BulkFieldWorkerImportModal: React.FC<BulkFieldWorkerImportModalProps> = ({ open, onOpenChange }) => {
  const { fetchWorkers, workers: existingWorkers } = useFieldWorkers();
  const { projects } = useProjects();
  const { tablets } = useTablets();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });
  const [step, setStep] = useState<'upload' | 'validate' | 'preview' | 'complete'>('upload');

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setValidationResults([]);
    setIsValidating(false);
    setIsImporting(false);
    setImportComplete(false);
    setImportResults({ success: 0, failed: 0 });
    setStep('upload');
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const validateRows = (data: ImportRow[]): ValidationResult[] => {
    // Track staff codes per project within the import file for duplicate detection
    const staffCodesByProject: Map<string, { code: string; rowIndex: number }[]> = new Map();
    
    // First pass: collect all staff codes by project
    data.forEach((row, index) => {
      if (row.staff_id?.trim() && row.project_name?.trim()) {
        const projectKey = row.project_name.toLowerCase().trim();
        const staffCode = row.staff_id.toUpperCase().trim();
        
        if (!staffCodesByProject.has(projectKey)) {
          staffCodesByProject.set(projectKey, []);
        }
        staffCodesByProject.get(projectKey)!.push({ code: staffCode, rowIndex: index });
      }
    });

    // Second pass: validate each row
    return data.map((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Required fields
      if (!row.staff_id?.trim()) {
        errors.push('Staff Code is required');
      } else {
        const staffCode = row.staff_id.toUpperCase().trim();
        if (!/^[A-Z]{2}$/.test(staffCode)) {
          errors.push('Staff Code must be exactly 2 uppercase letters (e.g., AB, CD)');
        } else if (row.project_name?.trim()) {
          const projectKey = row.project_name.toLowerCase().trim();
          const project = projects.find(p => p.name.toLowerCase() === projectKey);
          
          if (project) {
            // Check for duplicates within the import file
            const codesInProject = staffCodesByProject.get(projectKey) || [];
            const duplicatesInFile = codesInProject.filter(
              c => c.code === staffCode && c.rowIndex !== index
            );
            if (duplicatesInFile.length > 0) {
              const otherRows = duplicatesInFile.map(d => d.rowIndex + 1).join(', ');
              errors.push(`Staff Code "${staffCode}" is duplicated in this file for project "${row.project_name}" (also in row${duplicatesInFile.length > 1 ? 's' : ''} ${otherRows})`);
            }

            // Check for duplicates against existing workers in the database
            const existingWorker = existingWorkers.find(
              w => w.staff_id.toUpperCase() === staffCode && 
                   w.assigned_project_id === project.id
            );
            if (existingWorker) {
              errors.push(`Staff Code "${staffCode}" already exists in project "${row.project_name}" (assigned to ${existingWorker.full_name})`);
            }
          }
        }
      }
      
      if (!row.full_name?.trim()) {
        errors.push('Full Name is required');
      }

      // Project validation
      if (row.project_name?.trim()) {
        const projectExists = projects.some(
          p => p.name.toLowerCase() === row.project_name!.toLowerCase().trim()
        );
        if (!projectExists) {
          warnings.push(`Project "${row.project_name}" not found. Worker will be created without project assignment.`);
        }
      }

      // Tablet validation
      if (row.tablet_id?.trim()) {
        const tablet = tablets.find(
          t => t.tablet_id.toLowerCase() === row.tablet_id!.toLowerCase().trim()
        );
        if (!tablet) {
          warnings.push(`Tablet "${row.tablet_id}" not found. Worker will be created without tablet assignment.`);
        } else if (tablet.status !== 'available') {
          warnings.push(`Tablet "${row.tablet_id}" is not available (status: ${tablet.status}). Will skip tablet assignment.`);
        }
      }

      return {
        row: index + 1,
        data: row,
        errors,
        warnings,
        isValid: errors.length === 0
      };
    });
  };

  const parseCSV = (file: File): Promise<ImportRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
        complete: (results) => {
          resolve(results.data as ImportRow[]);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const parseExcel = (file: File): Promise<ImportRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
            defval: '',
            raw: false
          });
          
          // Normalize headers
          const normalizedData = jsonData.map((row: any) => {
            const normalized: any = {};
            Object.keys(row).forEach(key => {
              const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
              normalized[normalizedKey] = row[key];
            });
            return normalized as ImportRow;
          });
          
          resolve(normalizedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    setIsValidating(true);

    try {
      let data: ImportRow[];
      
      if (fileExtension === 'csv') {
        data = await parseCSV(selectedFile);
      } else {
        data = await parseExcel(selectedFile);
      }

      setParsedData(data);
      
      // Validate all rows (including duplicate checks)
      const results = validateRows(data);
      setValidationResults(results);
      setStep('validate');
      
    } catch (error: any) {
      toast({
        title: "Error parsing file",
        description: error.message || "Failed to parse the uploaded file",
        variant: "destructive"
      });
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    const validRows = validationResults.filter(r => r.isValid);
    
    if (validRows.length === 0) {
      toast({
        title: "No valid rows",
        description: "There are no valid rows to import",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const result of validRows) {
      const row = result.data;
      
      // Find project ID if project name is provided
      let assignedProjectId: string | null = null;
      if (row.project_name?.trim()) {
        const project = projects.find(
          p => p.name.toLowerCase() === row.project_name!.toLowerCase().trim()
        );
        if (project) {
          assignedProjectId = project.id;
        }
      }

      // Find tablet if tablet_id is provided and available
      let assignedTabletId: string | null = null;
      if (row.tablet_id?.trim()) {
        const tablet = tablets.find(
          t => t.tablet_id.toLowerCase() === row.tablet_id!.toLowerCase().trim() && t.status === 'available'
        );
        if (tablet) {
          assignedTabletId = tablet.id;
        }
      }

      // Determine is_active status
      const isActiveValue = row.is_active?.toLowerCase().trim();
      const isActive = !isActiveValue || isActiveValue === 'true' || isActiveValue === 'yes' || isActiveValue === 'active' || isActiveValue === '1';

      const workerData = {
        staff_id: row.staff_id.toUpperCase().trim(),
        full_name: row.full_name.trim(),
        assigned_project_id: assignedProjectId,
        assigned_tablet_id: assignedTabletId,
        is_active: isActive,
        assignment_date: assignedTabletId ? new Date().toISOString() : null
      };

      const { error } = await supabase.from('field_workers').insert([workerData]);

      if (error) {
        console.error(`Failed to import worker ${row.staff_id}:`, error);
        failCount++;
      } else {
        // Update tablet status if assigned
        if (assignedTabletId) {
          await supabase
            .from('tablets')
            .update({ 
              status: 'assigned',
              assigned_project_id: assignedProjectId,
              date_assigned: new Date().toISOString()
            })
            .eq('id', assignedTabletId);
        }
        successCount++;
      }
    }

    setImportResults({ success: successCount, failed: failCount });
    setImportComplete(true);
    setIsImporting(false);
    setStep('complete');
    
    // Refresh workers list
    await fetchWorkers();

    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} field workers. ${failCount > 0 ? `${failCount} failed.` : ''}`,
    });
  };

  // Generate preview summary
  const getPreviewSummary = () => {
    const validRows = validationResults.filter(r => r.isValid);
    const invalidRows = validationResults.filter(r => !r.isValid);
    const rowsWithWarnings = validationResults.filter(r => r.isValid && r.warnings.length > 0);
    
    // Count by project
    const projectCounts: Record<string, number> = {};
    const noProjectCount = validRows.filter(r => !r.data.project_name?.trim()).length;
    
    validRows.forEach(r => {
      if (r.data.project_name?.trim()) {
        const projectName = r.data.project_name.trim();
        const projectExists = projects.some(p => p.name.toLowerCase() === projectName.toLowerCase());
        if (projectExists) {
          projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
        }
      }
    });

    // Count tablet assignments
    const tabletAssignments = validRows.filter(r => {
      if (!r.data.tablet_id?.trim()) return false;
      const tablet = tablets.find(t => t.tablet_id.toLowerCase() === r.data.tablet_id!.toLowerCase().trim());
      return tablet && tablet.status === 'available';
    }).length;

    // Count active vs inactive
    const activeCount = validRows.filter(r => {
      const isActiveValue = r.data.is_active?.toLowerCase().trim();
      return !isActiveValue || isActiveValue === 'true' || isActiveValue === 'yes' || isActiveValue === 'active' || isActiveValue === '1';
    }).length;
    const inactiveCount = validRows.length - activeCount;

    return {
      total: validationResults.length,
      willCreate: validRows.length,
      willSkip: invalidRows.length,
      withWarnings: rowsWithWarnings.length,
      projectCounts,
      noProjectCount,
      tabletAssignments,
      activeCount,
      inactiveCount
    };
  };

  const downloadTemplate = () => {
    const template = [
      ['staff_id', 'full_name', 'project_name', 'tablet_id', 'is_active'],
      ['AB', 'John Smith', 'Project Alpha', 'TB-0001', 'active'],
      ['CD', 'Jane Doe', 'Project Beta', '', 'active'],
      ['EF', 'Bob Wilson', '', '', 'inactive']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Field Workers');
    XLSX.writeFile(wb, 'field_worker_import_template.xlsx');
  };

  const validCount = validationResults.filter(r => r.isValid).length;
  const invalidCount = validationResults.filter(r => !r.isValid).length;
  const warningCount = validationResults.filter(r => r.warnings.length > 0).length;
  const previewSummary = step === 'preview' ? getPreviewSummary() : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Field Workers
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV or Excel file to import multiple field workers at once.'}
            {step === 'validate' && 'Review validation results before proceeding to import preview.'}
            {step === 'preview' && 'Review what will be created before confirming the import.'}
            {step === 'complete' && 'Import has been completed.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        {file && (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              step === 'validate' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <span>1. Validate</span>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              step === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <Eye className="h-3 w-3 mr-1" />
              <span>2. Preview</span>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              step === 'complete' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              <span>3. Import</span>
            </div>
          </div>
        )}

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Template Download - only show on upload step */}
          {step === 'upload' && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Need a template? Download our sample file to get started.
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          )}

          {/* File Upload */}
          {step === 'upload' && !file && (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <Label htmlFor="worker-file-upload" className="cursor-pointer">
                <span className="text-primary font-medium">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                CSV, XLS, or XLSX files only
              </p>
              <Input
                id="worker-file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Loading State */}
          {isValidating && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Validating data...</span>
            </div>
          )}

          {/* Validation Step */}
          {step === 'validate' && file && !isValidating && (
            <>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>
                  Change file
                </Button>
              </div>

              {/* Summary Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {validCount} valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="text-destructive border-destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    {invalidCount} will be skipped
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {warningCount} with warnings
                  </Badge>
                )}
              </div>

              {/* Validation Details */}
              <ScrollArea className="flex-1 max-h-[300px] border rounded-lg">
                <div className="p-4 space-y-3">
                  {validationResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.isValid 
                          ? result.warnings.length > 0 
                            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                            : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                          : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {result.isValid ? (
                            result.warnings.length > 0 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <span className="font-medium text-sm">
                            Row {result.row}: {result.data.staff_id || '(no code)'} - {result.data.full_name || '(no name)'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {result.data.project_name || 'No project'}
                        </span>
                      </div>
                      
                      {result.errors.length > 0 && (
                        <ul className="mt-2 text-xs text-destructive space-y-1">
                          {result.errors.map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      )}
                      
                      {result.warnings.length > 0 && (
                        <ul className="mt-2 text-xs text-yellow-700 dark:text-yellow-500 space-y-1">
                          {result.warnings.map((warning, i) => (
                            <li key={i}>• {warning}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Preview Step */}
          {step === 'preview' && previewSummary && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Import Summary
                </h3>
                
                {/* Main Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600">{previewSummary.willCreate}</div>
                    <div className="text-xs text-green-700 dark:text-green-400">Will be created</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="text-2xl font-bold text-destructive">{previewSummary.willSkip}</div>
                    <div className="text-xs text-red-700 dark:text-red-400">Will be skipped</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-2xl font-bold text-yellow-600">{previewSummary.withWarnings}</div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-400">With warnings</div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  {/* Project Breakdown */}
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Project Assignment</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {Object.entries(previewSummary.projectCounts).map(([project, count]) => (
                        <div key={project} className="flex justify-between">
                          <span className="text-muted-foreground">{project}</span>
                          <span className="font-medium">{count} worker{count !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                      {previewSummary.noProjectCount > 0 && (
                        <div className="flex justify-between text-yellow-600">
                          <span>No project assigned</span>
                          <span className="font-medium">{previewSummary.noProjectCount} worker{previewSummary.noProjectCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tablet & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Tablet className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Tablet Assignments</span>
                      </div>
                      <div className="text-2xl font-bold">{previewSummary.tabletAssignments}</div>
                      <div className="text-xs text-muted-foreground">tablets will be assigned</div>
                    </div>
                    
                    <div className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Status</span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="font-bold text-green-600">{previewSummary.activeCount}</span>
                          <span className="text-muted-foreground ml-1">active</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-500">{previewSummary.inactiveCount}</span>
                          <span className="text-muted-foreground ml-1">inactive</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {previewSummary.willSkip > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    {previewSummary.willSkip} row{previewSummary.willSkip !== 1 ? 's' : ''} will be skipped due to validation errors.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Import Complete */}
          {step === 'complete' && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Import complete! Successfully imported {importResults.success} field workers.
                {importResults.failed > 0 && ` ${importResults.failed} failed to import.`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step === 'preview' && (
              <Button variant="ghost" onClick={() => setStep('validate')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Validation
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              {step === 'complete' ? 'Close' : 'Cancel'}
            </Button>
            
            {step === 'validate' && (
              <Button 
                onClick={() => setStep('preview')} 
                disabled={validCount === 0}
              >
                Preview Import
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {step === 'preview' && (
              <Button 
                onClick={handleImport} 
                disabled={validCount === 0 || isImporting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Import ({validCount})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkFieldWorkerImportModal;
