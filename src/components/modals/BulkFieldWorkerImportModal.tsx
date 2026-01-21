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
  Download
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
  const { fetchWorkers } = useFieldWorkers();
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

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setValidationResults([]);
    setIsValidating(false);
    setIsImporting(false);
    setImportComplete(false);
    setImportResults({ success: 0, failed: 0 });
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const validateRow = (row: ImportRow, index: number): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!row.staff_id?.trim()) {
      errors.push('Staff Code is required');
    } else {
      const staffCode = row.staff_id.toUpperCase().trim();
      if (!/^[A-Z]{2}$/.test(staffCode)) {
        errors.push('Staff Code must be exactly 2 uppercase letters (e.g., AB, CD)');
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
      
      // Validate all rows
      const results = data.map((row, index) => validateRow(row, index));
      setValidationResults(results);
      
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
    
    // Refresh workers list
    await fetchWorkers();

    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} field workers. ${failCount > 0 ? `${failCount} failed.` : ''}`,
    });
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Field Workers
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple field workers at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Template Download */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              Need a template? Download our sample file to get started.
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          {!file && (
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

          {/* Validation Results */}
          {file && !isValidating && !importComplete && (
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
                    {invalidCount} invalid
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

          {/* Import Complete */}
          {importComplete && (
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
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {importComplete ? 'Close' : 'Cancel'}
          </Button>
          {file && !isValidating && !importComplete && (
            <Button 
              onClick={handleImport} 
              disabled={validCount === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {validCount} Workers
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkFieldWorkerImportModal;
