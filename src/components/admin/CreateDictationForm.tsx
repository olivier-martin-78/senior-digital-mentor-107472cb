
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import SubActivitySelector from '@/components/activities/SubActivitySelector';

interface CreateDictationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateDictationForm: React.FC<CreateDictationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: '',
    dictationText: '',
    correctedText: '',
    thumbnailUrl: '',
    subActivityTagId: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer une dictée',
        variant: 'destructive',
      });
      return;
    }

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
        subActivityTagId: formData.subActivityTagId
      };

      const { error } = await supabase
        .from('activities')
        .insert([{
          activity_type: 'games',
          title: formData.title,
          link: '',
          iframe_code: JSON.stringify(dictationData),
          thumbnail_url: formData.thumbnailUrl || null,
          sub_activity_tag_id: formData.subActivityTagId || null,
          created_by: user.id,
          shared_globally: false
        }]);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Dictée créée avec succès',
      });

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la création de la dictée:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la dictée',
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
          Créer une dictée
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

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer la dictée'}
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

export default CreateDictationForm;
