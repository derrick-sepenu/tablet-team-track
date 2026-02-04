import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, Search } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface BulkInventoryImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportRow {
  item_name: string;
  category: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  asset_tag?: string;
  condition: string;
  quantity?: string;
  location?: string;
  assigned_to?: string;
  notes?: string;
}

interface ValidationResult {
  valid: ImportRow[];
  invalid: { row: ImportRow; errors: string[] }[];
}

const VALID_CATEGORIES = ['laptop', 'desktop', 'mouse', 'keyboard', 'monitor', 'printer', 'networking', 'storage', 'accessories', 'other'];
const VALID_CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged', 'decommissioned'];

const BulkInventoryImportModal: React.FC<BulkInventoryImportModalProps> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { createItem } = useInventoryItems();

  const resetState = useCallback(() => {
    setStep('upload');
    setValidationResult(null);
    setIsImporting(false);
    setSearchQuery('');
  }, []);

  const filteredValid = validationResult?.valid.filter(row => 
    row.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.asset_tag?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredInvalid = validationResult?.invalid.filter(item =>
    item.row.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.row.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.row.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.errors.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const validateRows = (rows: ImportRow[]): ValidationResult => {
    const valid: ImportRow[] = [];
    const invalid: { row: ImportRow; errors: string[] }[] = [];

    rows.forEach((row) => {
      const errors: string[] = [];

      if (!row.item_name?.trim()) {
        errors.push("Item name is required");
      }

      const category = row.category?.toLowerCase().trim() || 'other';
      if (!VALID_CATEGORIES.includes(category)) {
        errors.push(`Invalid category: ${row.category}. Valid: ${VALID_CATEGORIES.join(', ')}`);
      }

      const condition = row.condition?.toLowerCase().trim() || 'new';
      if (!VALID_CONDITIONS.includes(condition)) {
        errors.push(`Invalid condition: ${row.condition}. Valid: ${VALID_CONDITIONS.join(', ')}`);
      }

      const quantity = parseInt(row.quantity || '1', 10);
      if (isNaN(quantity) || quantity < 1) {
        errors.push("Quantity must be a positive number");
      }

      if (errors.length > 0) {
        invalid.push({ row, errors });
      } else {
        valid.push({
          ...row,
          category: category,
          condition: condition,
          quantity: String(quantity),
        });
      }
    });

    return { valid, invalid };
  };

  const parseFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validation = validateRows(results.data as ImportRow[]);
          setValidationResult(validation);
          setStep('preview');
        },
        error: (error) => {
          toast({
            title: "Parse Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet) as ImportRow[];
          const validation = validateRows(jsonData);
          setValidationResult(validation);
          setStep('preview');
        } catch (error) {
          toast({
            title: "Parse Error",
            description: "Failed to parse Excel file",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;

    setIsImporting(true);
    setStep('importing');

    let successCount = 0;
    let failCount = 0;

    for (const row of validationResult.valid) {
      try {
        const result = await createItem({
          item_name: row.item_name.trim(),
          category: row.category as any,
          brand: row.brand?.trim() || undefined,
          model: row.model?.trim() || undefined,
          serial_number: row.serial_number?.trim() || undefined,
          asset_tag: row.asset_tag?.trim() || undefined,
          condition: row.condition as any,
          quantity: parseInt(row.quantity || '1', 10),
          location: row.location?.trim() || undefined,
          assigned_to: row.assigned_to?.trim() || undefined,
          notes: row.notes?.trim() || undefined,
          is_active: true,
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} items. ${failCount > 0 ? `${failCount} failed.` : ''}`,
      variant: failCount > 0 ? "destructive" : "default",
    });

    handleClose();
  };

  const downloadTemplate = () => {
    const template = [
      {
        item_name: 'Dell Laptop',
        category: 'laptop',
        brand: 'Dell',
        model: 'Latitude 5520',
        serial_number: 'ABC123',
        asset_tag: 'IT-001',
        condition: 'new',
        quantity: '1',
        location: 'Office A',
        assigned_to: 'John Doe',
        notes: 'Company laptop',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'inventory_import_template.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Inventory Items</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple inventory items at once.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Download Template</p>
                  <p className="text-sm text-muted-foreground">Get the import template with example data</p>
                </div>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary font-medium">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-2">CSV or Excel files supported</p>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Required columns:</strong> item_name</p>
              <p><strong>Optional columns:</strong> category, brand, model, serial_number, asset_tag, condition, quantity, location, assigned_to, notes</p>
              <p><strong>Valid categories:</strong> {VALID_CATEGORIES.join(', ')}</p>
              <p><strong>Valid conditions:</strong> {VALID_CONDITIONS.join(', ')}</p>
            </div>
          </div>
        )}

        {step === 'preview' && validationResult && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name, category, brand, serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-emerald-500/10">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">
                    {searchQuery ? `${filteredValid.length} of ${validationResult.valid.length}` : validationResult.valid.length} Valid Items
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Ready to import</p>
              </div>
              <div className="p-4 border rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {searchQuery ? `${filteredInvalid.length} of ${validationResult.invalid.length}` : validationResult.invalid.length} Invalid Items
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Will be skipped</p>
              </div>
            </div>

            {filteredValid.length > 0 && (
              <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="font-medium text-sm mb-2 text-emerald-600 dark:text-emerald-400">Valid Items Preview:</p>
                {filteredValid.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">{item.item_name}</span>
                    {item.category && <span className="ml-2">({item.category})</span>}
                    {item.brand && <span className="ml-2">• {item.brand}</span>}
                  </div>
                ))}
                {filteredValid.length > 5 && (
                  <p className="text-sm text-muted-foreground">...and {filteredValid.length - 5} more</p>
                )}
              </div>
            )}

            {filteredInvalid.length > 0 && (
              <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="font-medium text-sm mb-2 text-destructive">Validation Errors:</p>
                {filteredInvalid.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">{item.row.item_name || 'Unknown'}: </span>
                    {item.errors.join('; ')}
                  </div>
                ))}
                {filteredInvalid.length > 5 && (
                  <p className="text-sm text-muted-foreground">...and {filteredInvalid.length - 5} more</p>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetState}>Back</Button>
              <Button 
                onClick={handleImport} 
                disabled={validationResult.valid.length === 0}
              >
                Import {validationResult.valid.length} Items
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="font-medium">Importing items...</p>
            <p className="text-sm text-muted-foreground">Please wait while we process your data</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkInventoryImportModal;
