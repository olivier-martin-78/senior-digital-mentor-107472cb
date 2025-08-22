import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SpatialSlot {
  id: string;
  label: string;
  icon: string;
  x_position: number;
  y_position: number;
}

interface SpatialSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  levelId: string;
  spatialSlot?: SpatialSlot | null;
}

const COMMON_LOCATION_ICONS = [
  '🏡', '🚪', '🪟', '🛏️', '🚿', '🧴', '🍽️', '🔥', '📺', '🪑',
  '🛋️', '🪞', '🚽', '🧽', '🧺', '🌿', '🪴', '⭐', '🔲', '📍'
];

export default function SpatialSlotModal({ isOpen, onClose, onSave, levelId, spatialSlot }: SpatialSlotModalProps) {
  const [formData, setFormData] = useState({
    label: '',
    icon: '',
    x_position: 0,
    y_position: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (spatialSlot) {
      setFormData({
        label: spatialSlot.label,
        icon: spatialSlot.icon,
        x_position: spatialSlot.x_position,
        y_position: spatialSlot.y_position
      });
    } else {
      setFormData({
        label: '',
        icon: '',
        x_position: 0,
        y_position: 0
      });
    }
  }, [spatialSlot, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.icon.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      if (spatialSlot) {
        // Update existing spatial slot
        const { error } = await supabase
          .from('cognitive_puzzle_spatial_slots')
          .update({
            label: formData.label.trim(),
            icon: formData.icon.trim(),
            x_position: formData.x_position,
            y_position: formData.y_position
          })
          .eq('id', spatialSlot.id);

        if (error) throw error;
        toast.success('Zone spatiale modifiée avec succès');
      } else {
        // Create new spatial slot
        const { error } = await supabase
          .from('cognitive_puzzle_spatial_slots')
          .insert({
            level_id: levelId,
            label: formData.label.trim(),
            icon: formData.icon.trim(),
            x_position: formData.x_position,
            y_position: formData.y_position
          });

        if (error) throw error;
        toast.success('Zone spatiale créée avec succès');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving spatial slot:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {spatialSlot ? 'Modifier la zone spatiale' : 'Ajouter une zone spatiale'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Nom de la zone *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Ex: Cuisine"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icône *</Label>
            <div className="space-y-2">
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="Ex: 🏡"
                required
              />
              <div className="flex flex-wrap gap-1">
                {COMMON_LOCATION_ICONS.map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-lg p-1 h-8 w-8"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="x_position">Position X</Label>
              <Input
                id="x_position"
                type="number"
                value={formData.x_position}
                onChange={(e) => setFormData(prev => ({ ...prev, x_position: parseInt(e.target.value) || 0 }))}
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="y_position">Position Y</Label>
              <Input
                id="y_position"
                type="number"
                value={formData.y_position}
                onChange={(e) => setFormData(prev => ({ ...prev, y_position: parseInt(e.target.value) || 0 }))}
                min="0"
                max="100"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : (spatialSlot ? 'Modifier' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}