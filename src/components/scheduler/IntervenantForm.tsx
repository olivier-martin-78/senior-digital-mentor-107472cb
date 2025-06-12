
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Intervenant } from '@/types/appointments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface IntervenantFormProps {
  intervenant?: Intervenant | null;
  onSave: () => void;
  onCancel: () => void;
}

const IntervenantForm: React.FC<IntervenantFormProps> = ({ intervenant, onSave, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    speciality: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (intervenant) {
      setFormData({
        first_name: intervenant.first_name,
        last_name: intervenant.last_name,
        email: intervenant.email || '',
        phone: intervenant.phone || '',
        speciality: intervenant.speciality || '',
        active: intervenant.active,
      });
    }
  }, [intervenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        speciality: formData.speciality || null,
      };

      if (intervenant) {
        const { error } = await supabase
          .from('intervenants')
          .update(data)
          .eq('id', intervenant.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Intervenant modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('intervenants')
          .insert([{ ...data, created_by: user.id }]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Intervenant créé avec succès',
        });
      }

      onSave();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'intervenant:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'intervenant',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {intervenant ? 'Modifier l\'intervenant' : 'Nouvel intervenant'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="speciality">Spécialité</Label>
            <Input
              id="speciality"
              value={formData.speciality}
              onChange={(e) => setFormData(prev => ({ ...prev, speciality: e.target.value }))}
              placeholder="ex: Auxiliaire de vie, Infirmier..."
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="active">Intervenant actif</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IntervenantForm;
