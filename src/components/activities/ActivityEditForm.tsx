import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity } from '@/hooks/useActivities';
import ActivityThumbnailUploader from './ActivityThumbnailUploader';
import SubActivitySelector from './SubActivitySelector';

interface ActivityEditFormProps {
  activity: Activity;
  onSave: () => void;
  onCancel: () => void;
}

const activityTypes = [
  { value: 'meditation', label: 'Méditation' },
  { value: 'games', label: 'Jeux' },
  { value: 'connection', label: 'Connexion' },
  { value: 'exercises', label: 'Exercices' },
  { value: 'reading', label: 'Lecture' },
  { value: 'writing', label: 'Écriture' },
];

const ActivityEditForm: React.FC<ActivityEditFormProps> = ({ activity, onSave, onCancel }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    activity_type: activity.activity_type,
    title: activity.title,
    link: activity.link,
    thumbnail_url: activity.thumbnail_url || '',
    activity_date: activity.activity_date || '',
    sub_activity_tag_id: activity.sub_activity_tag_id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToUpdate = {
        ...formData,
        activity_date: formData.activity_date || null,
        thumbnail_url: formData.thumbnail_url || null,
        sub_activity_tag_id: formData.sub_activity_tag_id || null,
      };

      const { error } = await supabase
        .from('activities')
        .update(dataToUpdate)
        .eq('id', activity.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Activité modifiée avec succès',
      });

      onSave();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier l\'activité',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifier l'activité</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="activity_type">Type d'activité</Label>
            <Select
              value={formData.activity_type}
              onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SubActivitySelector
            selectedSubTagId={formData.sub_activity_tag_id}
            onSubTagChange={(subTagId) => setFormData({ ...formData, sub_activity_tag_id: subTagId || '' })}
          />

          <div>
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de l'activité"
              required
            />
          </div>

          <div>
            <Label htmlFor="link">Lien (Internet ou YouTube)</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://example.com ou https://youtube.com/watch?v=..."
              type="url"
              required
            />
          </div>

          <ActivityThumbnailUploader
            currentThumbnail={formData.thumbnail_url}
            onThumbnailChange={(url) => setFormData({ ...formData, thumbnail_url: url || '' })}
          />

          <div>
            <Label htmlFor="activity_date">Date de l'activité (optionnel)</Label>
            <Input
              id="activity_date"
              value={formData.activity_date}
              onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
              type="date"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">Sauvegarder</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ActivityEditForm;
