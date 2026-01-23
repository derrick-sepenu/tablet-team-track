import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventoryItems, InventoryItem } from "@/hooks/useInventoryItems";
import { Loader2 } from "lucide-react";

interface InventoryItemFormProps {
  item?: InventoryItem;
  onSuccess: () => void;
  onCancel: () => void;
}

const categories = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'printer', label: 'Printer' },
  { value: 'networking', label: 'Networking' },
  { value: 'storage', label: 'Storage' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
];

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

const InventoryItemForm: React.FC<InventoryItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const { createItem, updateItem } = useInventoryItems();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    item_name: item?.item_name || '',
    category: item?.category || 'other',
    brand: item?.brand || '',
    model: item?.model || '',
    serial_number: item?.serial_number || '',
    asset_tag: item?.asset_tag || '',
    condition: item?.condition || 'new',
    quantity: item?.quantity || 1,
    location: item?.location || '',
    purchase_date: item?.purchase_date || '',
    purchase_price: item?.purchase_price || '',
    warranty_expiry: item?.warranty_expiry || '',
    assigned_to: item?.assigned_to || '',
    notes: item?.notes || '',
    is_active: item?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submitData = {
      ...formData,
      quantity: Number(formData.quantity),
      purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
      purchase_date: formData.purchase_date || null,
      warranty_expiry: formData.warranty_expiry || null,
      brand: formData.brand || null,
      model: formData.model || null,
      serial_number: formData.serial_number || null,
      asset_tag: formData.asset_tag || null,
      location: formData.location || null,
      assigned_to: formData.assigned_to || null,
      notes: formData.notes || null,
    } as any;

    try {
      if (item) {
        await updateItem(item.id, submitData);
      } else {
        await createItem(submitData);
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item_name">Item Name *</Label>
          <Input
            id="item_name"
            value={formData.item_name}
            onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
            placeholder="Enter item name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            placeholder="Enter brand"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
            placeholder="Enter model"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serial_number">Serial Number</Label>
          <Input
            id="serial_number"
            value={formData.serial_number}
            onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
            placeholder="Enter serial number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="asset_tag">Asset Tag</Label>
          <Input
            id="asset_tag"
            value={formData.asset_tag}
            onChange={(e) => setFormData(prev => ({ ...prev, asset_tag: e.target.value }))}
            placeholder="Enter asset tag"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">Condition *</Label>
          <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value as any }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {conditions.map(cond => (
                <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Enter location"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Input
            id="assigned_to"
            value={formData.assigned_to}
            onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
            placeholder="Enter assignee name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_date">Purchase Date</Label>
          <Input
            id="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_price">Purchase Price</Label>
          <Input
            id="purchase_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.purchase_price}
            onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
          <Input
            id="warranty_expiry"
            type="date"
            value={formData.warranty_expiry}
            onChange={(e) => setFormData(prev => ({ ...prev, warranty_expiry: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes..."
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">{formData.notes.length}/500</p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
};

export default InventoryItemForm;
