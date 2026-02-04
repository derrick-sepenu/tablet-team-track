import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Navigation from "@/components/Navigation";
import InventoryItemModal from "@/components/modals/InventoryItemModal";
import BulkInventoryImportModal from "@/components/modals/BulkInventoryImportModal";
import { useInventoryItems, InventoryItem } from "@/hooks/useInventoryItems";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { exportToCSV, formatInventoryItemsForExport } from "@/utils/exportUtils";
import * as XLSX from "xlsx";
import { 
  Search, 
  Plus,
  Package,
  Edit,
  Trash2,
  Loader2,
  Laptop,
  Monitor,
  HardDrive,
  Mouse,
  Keyboard,
  Printer,
  Network,
  Box,
  Download,
  Upload
} from "lucide-react";

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  
  const { items, loading, deleteItem } = useInventoryItems();
  const { profile } = useAuth();

  const handleExportCSV = () => {
    const dataToExport = formatInventoryItemsForExport(filteredItems);
    exportToCSV(dataToExport, `inventory_export_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportExcel = () => {
    const dataToExport = formatInventoryItemsForExport(filteredItems);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'laptop': return <Laptop className="h-5 w-5" />;
      case 'desktop': return <Monitor className="h-5 w-5" />;
      case 'monitor': return <Monitor className="h-5 w-5" />;
      case 'mouse': return <Mouse className="h-5 w-5" />;
      case 'keyboard': return <Keyboard className="h-5 w-5" />;
      case 'printer': return <Printer className="h-5 w-5" />;
      case 'networking': return <Network className="h-5 w-5" />;
      case 'storage': return <HardDrive className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'good': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'fair': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'poor': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'damaged': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'decommissioned': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesCondition = conditionFilter === "all" || item.condition === conditionFilter;
    
    return matchesSearch && matchesCategory && matchesCondition;
  });

  const handleAddItem = () => {
    setEditingItem(undefined);
    setModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">IT Inventory</h1>
            <p className="text-muted-foreground">Manage IT assets and equipment</p>
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportCSV}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {profile?.role === 'super_admin' && (
              <>
                <Button variant="outline" onClick={() => setImportModalOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, brand, model, serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="laptop">Laptop</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="mouse">Mouse</SelectItem>
              <SelectItem value="keyboard">Keyboard</SelectItem>
              <SelectItem value="monitor">Monitor</SelectItem>
              <SelectItem value="printer">Printer</SelectItem>
              <SelectItem value="networking">Networking</SelectItem>
              <SelectItem value="storage">Storage</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="decommissioned">Decommissioned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.item_name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                    </div>
                  </div>
                  <Badge className={getConditionColor(item.condition)}>
                    {item.condition}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {item.brand && (
                    <div>
                      <span className="text-muted-foreground">Brand:</span>
                      <p className="font-medium">{item.brand}</p>
                    </div>
                  )}
                  {item.model && (
                    <div>
                      <span className="text-muted-foreground">Model:</span>
                      <p className="font-medium">{item.model}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <p className="font-medium">{item.quantity}</p>
                  </div>
                  {item.location && (
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium">{item.location}</p>
                    </div>
                  )}
                  {item.asset_tag && (
                    <div>
                      <span className="text-muted-foreground">Asset Tag:</span>
                      <p className="font-medium">{item.asset_tag}</p>
                    </div>
                  )}
                  {item.assigned_to && (
                    <div>
                      <span className="text-muted-foreground">Assigned To:</span>
                      <p className="font-medium">{item.assigned_to}</p>
                    </div>
                  )}
                </div>

                {profile?.role === 'super_admin' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.item_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No inventory items found</h3>
            <p className="text-muted-foreground mt-1">
              {items.length === 0 ? "Add your first inventory item to get started." : "Try adjusting your search or filters."}
            </p>
          </div>
        )}
      </main>

      <InventoryItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={editingItem}
      />
      
      <BulkInventoryImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
    </div>
  );
};

export default InventoryPage;
