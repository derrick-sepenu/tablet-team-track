import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTablets } from '@/hooks/useTablets';
import { useProjects } from '@/hooks/useProjects';
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

interface BulkTabletImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportRow {
  tablet_id: string;
  serial_number: string;
  model: string;
  sim_number?: string;
  status?: string;
  notes?: string;
  project_name?: string;
}

interface ValidationResult {
  row: number;
  data: ImportRow;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

const VALID_STATUSES = ['available', 'assigned', 'in_repair', 'lost', 'returned'];

const BulkTabletImportModal: React.FC<BulkTabletImportModalProps> = ({ open, onOpenChange }) => {
  const { fetchTablets } = useTablets();
  const { projects } = useProjects();
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
    if (!row.tablet_id?.trim()) {
      errors.push('Tablet ID is required');
    }
    if (!row.serial_number?.trim()) {
      errors.push('Serial number is required');
    }
    if (!row.model?.trim()) {
      errors.push('Model is required');
    }

    // Status validation
    if (row.status && !VALID_STATUSES.includes(row.status.toLowerCase())) {
      errors.push(`Invalid status "${row.status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Project validation
    if (row.project_name) {
      const projectExists = projects.some(
        p => p.name.toLowerCase() === row.project_name!.toLowerCase()
      );
      if (!projectExists) {
        warnings.push(`Project "${row.project_name}" not found. Tablet will be created without project assignment.`);
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
      if (row.project_name) {
        const project = projects.find(
          p => p.name.toLowerCase() === row.project_name!.toLowerCase()
        );
        if (project) {
          assignedProjectId = project.id;
        }
      }

      const tabletData = {
        tablet_id: row.tablet_id.trim(),
        serial_number: row.serial_number.trim(),
        model: row.model.trim(),
        sim_number: row.sim_number?.trim() || null,
        status: (row.status?.toLowerCase() as 'available' | 'assigned' | 'in_repair' | 'lost' | 'returned') || 'available',
        notes: row.notes?.trim() || null,
        assigned_project_id: assignedProjectId,
        date_assigned: assignedProjectId ? new Date().toISOString() : null
      };

      const { error } = await supabase.from('tablets').insert([tabletData]);

      if (error) {
        console.error(`Failed to import tablet ${row.tablet_id}:`, error);
        failCount++;
      } else {
        successCount++;
      }
    }

    setImportResults({ success: successCount, failed: failCount });
    setImportComplete(true);
    setIsImporting(false);
    
    // Refresh tablets list
    await fetchTablets();

    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} tablets. ${failCount > 0 ? `${failCount} failed.` : ''}`,
      variant: failCount > 0 ? "default" : "default"
    });
  };

  const downloadTemplate = () => {
    const template = [
      ['tablet_id', 'serial_number', 'model', 'sim_number', 'status', 'notes', 'project_name'],
      ['TB-0001', 'SM-X706B123456', 'Galaxy Tab S8', '89001234567890123456', 'available', 'Sample notes', 'Project Alpha'],
      ['TB-0002', 'SM-X706B789012', 'Galaxy Tab S7', '', 'assigned', '', 'Project Beta']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tablets');
    XLSX.writeFile(wb, 'tablet_import_template.xlsx');
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
            Bulk Import Tablets
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple tablets at once.
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
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary font-medium">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                CSV, XLS, or XLSX files only
              </p>
              <Input
                id="file-upload"
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
                            Row {result.row}: {result.data.tablet_id || '(no ID)'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {result.data.model}
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
                Import complete! Successfully imported {importResults.success} tablets.
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
                  Import {validCount} Tablets
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkTabletImportModal;