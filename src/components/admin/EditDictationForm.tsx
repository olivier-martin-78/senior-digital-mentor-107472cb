
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from '@/hooks/useActivities';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
import { useAuth } from '@/contexts/AuthContext';

interface EditDictationFormProps {
  activity: Activity;
  onSave: () => void;
  onCancel: () => void;
}

const EditDictationForm: React.FC<EditDictationFormProps> = ({
  activity,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: activity.title,
    dictationText: '',
    correctedText: '',
    thumbnailUrl: activity.thumbnail_url || '',
    subActivityTagId: activity.sub_activity_tag_id || '',
    sharedGlobally: activity.shared_globally || false,
    audioUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // L'utilisateur peut partager s'il est le créateur de l'activité
  const canShareGlobally = user?.id === activity.created_by;

  useEffect(() => {
    if (activity.iframe_code) {
      try {
        const dictationData = JSON.parse(activity.iframe_code);
        setFormData(prev => ({
          ...prev,
          dictationText: dictationData.dictationText || '',
          correctedText: dictationData.correctedText || '',
          sharedGlobally: activity.shared_globally || false,
          audioUrl: dictationData.audioUrl || ''
        }));
      } catch (error) {
        console.error('Erreur lors du parsing des données de dictée:', error);
      }
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.dictationText.trim() || !formData.correctedText.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const dictationData = {
        type: 'dictation',
        title: formData.title,
        dictationText: formData.dictationText,
        correctedText: formData.correctedText,
        thumbnailUrl: formData.thumbnailUrl,
        subActivityTagId: formData.subActivityTagId,
        audioUrl: formData.audioUrl
      };

      const updateData: any = {
        title: formData.title,
        iframe_code: JSON.stringify(dictationData),
        thumbnail_url: formData.thumbnailUrl || null,
        sub_activity_tag_id: formData.subActivityTagId || null,
      };

      // N'inclure shared_globally que si l'utilisateur peut modifier ce paramètre
      if (canShareGlobally) {
        updateData.shared_globally = formData.sharedGlobally;
      }

      const { error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', activity.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Dictée modifiée avec succès',
      });

      onSave();
    } catch (error) {
      console.error('Erreur lors de la modification de la dictée:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la dictée',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Modifier la dictée
          <Button 
            onClick={onCancel}
            variant="outline"
            size="sm"
          >
            Fermer
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre de la dictée *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Dictée sur les homophones"
              required
            />
          </div>

          <SubActivitySelector
            activityType="games"
            selectedSubTagId={formData.subActivityTagId}
            onSubTagChange={(subTagId) => setFormData({ ...formData, subActivityTagId: subTagId || '' })}
          />

          <ActivityThumbnailUploader
            currentThumbnail={formData.thumbnailUrl}
            onThumbnailChange={(url) => setFormData({ ...formData, thumbnailUrl: url || '' })}
          />

          <div>
            <Label htmlFor="dictationText">Texte de la dictée *</Label>
            <Textarea
              id="dictationText"
              value={formData.dictationText}
              onChange={(e) => setFormData({ ...formData, dictationText: e.target.value })}
              placeholder="Tapez le texte qui sera dicté par la voix de synthèse..."
              className="min-h-[100px]"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Ce texte sera lu par la voix de synthèse
            </p>
          </div>

          <div>
            <Label htmlFor="correctedText">Texte corrigé *</Label>
            <Textarea
              id="correctedText"
              value={formData.correctedText}
              onChange={(e) => setFormData({ ...formData, correctedText: e.target.value })}
              placeholder="Tapez le texte de référence pour la correction..."
              className="min-h-[100px]"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Ce texte servira de référence pour la correction automatique
            </p>
          </div>

          <div>
            <Label htmlFor="audioUrl">Fichier audio MP3 (optionnel)</Label>
            <Input
              id="audioUrl"
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setFormData({ ...formData, audioUrl: url });
                }
              }}
              className="file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-900 hover:file:bg-blue-200"
            />
            <p className="text-sm text-gray-500 mt-1">
              Uploadez un fichier MP3 généré avec ElevenLabs ou autre. Si aucun fichier n'est fourni, la synthèse vocale du navigateur sera utilisée.
            </p>
            {formData.audioUrl && (
              <p className="text-sm text-green-600 mt-1">✓ Fichier audio chargé</p>
            )}
          </div>

          {canShareGlobally && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sharedGlobally"
                checked={formData.sharedGlobally}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, sharedGlobally: checked === true })
                }
              />
              <Label htmlFor="sharedGlobally" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Partager avec tout le monde
              </Label>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Modification...' : 'Modifier la dictée'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditDictationForm;
