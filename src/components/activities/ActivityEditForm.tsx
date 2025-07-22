
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity } from '@/hooks/useActivities';
import ActivityThumbnailUploader from './ActivityThumbnailUploader';
import SubActivitySelector from './SubActivitySelector';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityEditFormProps {
  activity: Activity;
  onSave: () => void;
  onCancel: () => void;
}

const activityTypes = [
  { value: 'meditation', label: 'Relaxation' },
  { value: 'games', label: 'Jeux cognitifs' },
  { value: 'exercises', label: 'Gym douce' },
];

const ActivityEditForm: React.FC<ActivityEditFormProps> = ({ activity, onSave, onCancel }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    activity_type: activity.activity_type,
    title: activity.title,
    link: activity.link,
    iframe_code: activity.iframe_code || '',
    use_iframe: !!activity.iframe_code,
    thumbnail_url: activity.thumbnail_url || '',
    activity_date: activity.activity_date || '',
    sub_activity_tag_id: activity.sub_activity_tag_id || '',
    shared_globally: activity.shared_globally || false,
  });

  // Vérifier si l'utilisateur peut utiliser la fonction de partage global
  const canShareGlobally = user?.email === 'olivier.martin.78000@gmail.com' && 
                          ['meditation', 'games', 'exercises'].includes(activity.activity_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Exclure use_iframe et préparer les données pour la base de données
      const { use_iframe, ...formDataWithoutUseIframe } = formData;
      
      const dataToUpdate = {
        ...formDataWithoutUseIframe,
        activity_date: formData.activity_date || null,
        thumbnail_url: formData.thumbnail_url || null,
        sub_activity_tag_id: formData.sub_activity_tag_id || null,
        shared_globally: canShareGlobally ? formData.shared_globally : false,
        link: formData.use_iframe ? '' : formData.link,
        iframe_code: formData.use_iframe ? formData.iframe_code : null,
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
            activityType={formData.activity_type}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="use_iframe"
              checked={formData.use_iframe}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, use_iframe: checked as boolean })
              }
            />
            <Label htmlFor="use_iframe" className="text-sm font-medium">
              Utiliser un code d'intégration YouTube (iframe)
            </Label>
          </div>

          {formData.use_iframe ? (
            <div>
              <Label htmlFor="iframe_code">Code d'intégration YouTube</Label>
              <Textarea
                id="iframe_code"
                value={formData.iframe_code}
                onChange={(e) => setFormData({ ...formData, iframe_code: e.target.value })}
                placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." title="YouTube video player" frameborder="0" allow="..." allowfullscreen></iframe>'
                rows={4}
                required
              />
            </div>
          ) : (
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
          )}

          {!formData.use_iframe && (
            <ActivityThumbnailUploader
              currentThumbnail={formData.thumbnail_url}
              onThumbnailChange={(url) => setFormData({ ...formData, thumbnail_url: url || '' })}
            />
          )}

          <div>
            <Label htmlFor="activity_date">Date de l'activité (optionnel)</Label>
            <Input
              id="activity_date"
              value={formData.activity_date}
              onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
              type="date"
            />
          </div>

          {canShareGlobally && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shared_globally"
                checked={formData.shared_globally}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, shared_globally: checked as boolean })
                }
              />
              <Label htmlFor="shared_globally" className="text-sm font-medium">
                Partager avec tout le monde
              </Label>
              <p className="text-xs text-gray-500 ml-2">
                Cette activité sera visible par tous les utilisateurs connectés
              </p>
            </div>
          )}

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
