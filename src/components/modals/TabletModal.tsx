import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TabletForm from '@/components/forms/TabletForm';
import { Tablet } from '@/hooks/useTablets';

interface TabletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tablet?: Tablet;
}

const TabletModal: React.FC<TabletModalProps> = ({ open, onOpenChange, tablet }) => {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tablet ? 'Edit Tablet' : 'Add New Tablet'}
          </DialogTitle>
        </DialogHeader>
        <TabletForm 
          tablet={tablet}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TabletModal;