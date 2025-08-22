import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Activity {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  levelId: string;
  activity?: Activity | null;
}

const ACTIVITY_CATEGORIES = [
  { value: 'activity', label: 'Activité' },
  { value: 'twist', label: 'Imprévu' }
];

const COMMON_ICONS = [
  '🍳', '🧴', '🧽', '🚿', '🛏️', '📺', '🪴', '☕', '🧺', '🧹',
  '🍽️', '🥄', '🔧', '📱', '💊', '👕', '🧸', '📖', '🎵', '🕯️'
];

export default function ActivityModal({ isOpen, onClose, onSave, levelId, activity }: ActivityModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    category: 'activity'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name,
        icon: activity.icon,
        category: activity.category
      });
    } else {
      setFormData({
        name: '',
        icon: '',
        category: 'activity'
      });
    }
  }, [activity, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.icon.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      if (activity) {
        // Update existing activity
        const { error } = await supabase
          .from('cognitive_puzzle_activities')
          .update({
            name: formData.name.trim(),
            icon: formData.icon.trim(),
            category: formData.category
          })
          .eq('id', activity.id);

        if (error) throw error;
        toast.success('Objet modifié avec succès');
      } else {
        // Create new activity
        const { error } = await supabase
          .from('cognitive_puzzle_activities')
          .insert({
            level_id: levelId,
            name: formData.name.trim(),
            icon: formData.icon.trim(),
            category: formData.category
          });

        if (error) throw error;
        toast.success('Objet créé avec succès');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving activity:', error);
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
            {activity ? 'Modifier l\'objet' : 'Ajouter un objet'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'objet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Casserole"
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
                placeholder="Ex: 🍳"
                required
              />
              <div className="flex flex-wrap gap-1">
                {COMMON_ICONS.map((icon) => (
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
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
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
              {loading ? 'Sauvegarde...' : (activity ? 'Modifier' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}