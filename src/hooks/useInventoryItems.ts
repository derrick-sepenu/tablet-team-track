import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface InventoryItem {
  id: string;
  item_name: string;
  category: 'laptop' | 'desktop' | 'mouse' | 'keyboard' | 'monitor' | 'printer' | 'networking' | 'storage' | 'accessories' | 'other';
  brand?: string;
  model?: string;
  serial_number?: string;
  asset_tag?: string;
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged' | 'decommissioned';
  quantity: number;
  location?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  assigned_to?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useInventoryItems = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    const optimisticItem: InventoryItem = {
      id: `temp-${Date.now()}`,
      ...itemData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems(prev => [optimisticItem, ...prev]);

    try {
      const { error } = await supabase
        .from('inventory_items')
        .insert([itemData]);

      if (error) throw error;

      await fetchItems();
      
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      setItems(prev => prev.filter(i => i.id !== optimisticItem.id));
      console.error('Error creating inventory item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const originalItem = items.find(i => i.id === id);
    
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...updates, updated_at: new Date().toISOString() }
        : item
    ));

    try {
      const { error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      if (originalItem) {
        setItems(prev => prev.map(item => 
          item.id === id ? originalItem : item
        ));
      }
      console.error('Error updating inventory item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteItem = async (id: string) => {
    const originalItem = items.find(i => i.id === id);
    
    setItems(prev => prev.filter(item => item.id !== id));

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      if (originalItem) {
        setItems(prev => [...prev, originalItem]);
      }
      console.error('Error deleting inventory item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete inventory item",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchItems();

      const channel = supabase
        .channel('inventory_items_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, fetchItems)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  return { items, loading, createItem, updateItem, deleteItem, refetch: fetchItems };
};
