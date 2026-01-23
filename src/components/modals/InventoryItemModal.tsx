import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InventoryItemForm from "@/components/forms/InventoryItemForm";
import { InventoryItem } from "@/hooks/useInventoryItems";

interface InventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem;
}

const InventoryItemModal: React.FC<InventoryItemModalProps> = ({ open, onOpenChange, item }) => {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </DialogTitle>
        </DialogHeader>
        <InventoryItemForm 
          item={item}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default InventoryItemModal;
