import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RepairRequestForm from '@/components/forms/RepairRequestForm';

interface RepairRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedTabletId?: string;
}

const RepairRequestModal: React.FC<RepairRequestModalProps> = ({ 
  open, 
  onOpenChange, 
  preselectedTabletId 
}) => {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Repair Request</DialogTitle>
        </DialogHeader>
        <RepairRequestForm 
          preselectedTabletId={preselectedTabletId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RepairRequestModal;