
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Caregiver } from '@/types/appointments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CaregiverFormProps {
  clientId: string;
  caregiver?: Caregiver | null;
  onSave: () => void;
  onCancel: () => void;
}

const CaregiverForm: React.FC<CaregiverFormProps> = ({ clientId, caregiver, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    phone: '',
    email: '',
    relationship_type: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (caregiver) {
      setFormData({
        first_name: caregiver.first_name,
        last_name: caregiver.last_name,
        address: caregiver.address || '',
        phone: caregiver.phone || '',
        email: caregiver.email || '',
        relationship_type: caregiver.relationship_type,
      });
    }
  }, [caregiver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const data = {
        ...formData,
        client_id: clientId,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
      };

      if (caregiver) {
        const { error } = await supabase
          .from('caregivers')
          .update(data)
          .eq('id', caregiver.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Proche aidant modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('caregivers')
          .insert([data]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Proche aidant créé avec succès',
        });
      }

      onSave();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du proche aidant:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le proche aidant',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const relationshipTypes = [
    'Enfant',
    'Petit-enfant',
    'Conjoint(e)',
    'Parent',
    'Frère/Sœur',
    'Ami(e)',
    'Voisin(e)',
    'Autre'
  ];

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {caregiver ? 'Modifier le proche aidant' : 'Nouveau proche aidant'}
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
            <Label htmlFor="relationship_type">Lien avec le client *</Label>
            <Select
              value={formData.relationship_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_type: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le lien" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
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

export default CaregiverForm;
