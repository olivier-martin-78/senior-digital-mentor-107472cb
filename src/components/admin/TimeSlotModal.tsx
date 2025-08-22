import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TimeSlot {
  id: string;
  label: string;
  icon: string;
  period: string;
}

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  levelId: string;
  timeSlot?: TimeSlot | null;
}

const TIME_PERIODS = [
  { value: 'morning', label: 'Matin' },
  { value: 'noon', label: 'Midi' },
  { value: 'afternoon', label: 'Après-midi' },
  { value: 'evening', label: 'Soir' }
];

const COMMON_TIME_ICONS = [
  '🌅', '☀️', '🌇', '🌙', '⏰', '⏱️', '🕐', '🕑', '🕒', '🕓',
  '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '📅', '⏳'
];

export default function TimeSlotModal({ isOpen, onClose, onSave, levelId, timeSlot }: TimeSlotModalProps) {
  const [formData, setFormData] = useState({
    label: '',
    icon: '',
    period: 'morning'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (timeSlot) {
      setFormData({
        label: timeSlot.label,
        icon: timeSlot.icon,
        period: timeSlot.period
      });
    } else {
      setFormData({
        label: '',
        icon: '',
        period: 'morning'
      });
    }
  }, [timeSlot, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.icon.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      if (timeSlot) {
        // Update existing time slot
        const { error } = await supabase
          .from('cognitive_puzzle_time_slots')
          .update({
            label: formData.label.trim(),
            icon: formData.icon.trim(),
            period: formData.period
          })
          .eq('id', timeSlot.id);

        if (error) throw error;
        toast.success('Étape temporelle modifiée avec succès');
      } else {
        // Create new time slot
        const { error } = await supabase
          .from('cognitive_puzzle_time_slots')
          .insert({
            level_id: levelId,
            label: formData.label.trim(),
            icon: formData.icon.trim(),
            period: formData.period
          });

        if (error) throw error;
        toast.success('Étape temporelle créée avec succès');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving time slot:', error);
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
            {timeSlot ? 'Modifier l\'étape temporelle' : 'Ajouter une étape temporelle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Nom de l'étape *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Ex: Petit-déjeuner"
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
                placeholder="Ex: 🌅"
                required
              />
              <div className="flex flex-wrap gap-1">
                {COMMON_TIME_ICONS.map((icon) => (
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

          <div className="space-y-2">
            <Label htmlFor="period">Période</Label>
            <Select
              value={formData.period}
              onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : (timeSlot ? 'Modifier' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}