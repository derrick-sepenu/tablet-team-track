import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FieldWorkerForm from '@/components/forms/FieldWorkerForm';
import { FieldWorker } from '@/hooks/useFieldWorkers';

interface FieldWorkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker?: FieldWorker;
}

const FieldWorkerModal: React.FC<FieldWorkerModalProps> = ({ open, onOpenChange, worker }) => {
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
            {worker ? 'Edit Field Worker' : 'Add New Field Worker'}
          </DialogTitle>
        </DialogHeader>
        <FieldWorkerForm 
          worker={worker}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FieldWorkerModal;