import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
import { UserActionsService } from '@/services/UserActionsService';
import { Trash2, Plus } from 'lucide-react';
import { ReverseDictionaryWord, ReverseDictionaryData } from '@/types/reverseDictionary';

interface EditReverseDictionaryFormProps {
  activityId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditReverseDictionaryForm: React.FC<EditReverseDictionaryFormProps> = ({
  activityId,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: '',
    timerDuration: 30,
    thumbnailUrl: '',
    subActivityTagId: '',
    sharedGlobally: false,
  });
  
  const [words, setWords] = useState<ReverseDictionaryWord[]>([
    { definition: '', word: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('id', activityId)
          .single();

        if (error) throw error;

        if (data?.iframe_code) {
          const gameData: ReverseDictionaryData = JSON.parse(data.iframe_code);
          
          if (gameData.type === 'reverse_dictionary') {
            setFormData({
              title: data.title,
              timerDuration: gameData.timerDuration,
              thumbnailUrl: data.thumbnail_url || '',
              subActivityTagId: data.sub_activity_tag_id || '',
              sharedGlobally: data.shared_globally || false,
            });
            
            setWords(gameData.words);
          } else {
            throw new Error('Cette activité n\'est pas un dictionnaire inversé');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'activité:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger l\'activité',
          variant: 'destructive',
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadActivity();
  }, [activityId, toast]);

  const addWord = () => {
    setWords([...words, { definition: '', word: '' }]);
  };

  const removeWord = (index: number) => {
    if (words.length > 1) {
      setWords(words.filter((_, i) => i !== index));
    }
  };

  const updateWord = (index: number, field: keyof ReverseDictionaryWord, value: string) => {
    const updatedWords = [...words];
    updatedWords[index][field] = value;
    setWords(updatedWords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour modifier un dictionnaire inversé',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un titre',
        variant: 'destructive',
      });
      return;
    }

    // Vérifier que tous les mots ont une définition et un mot
    const validWords = words.filter(word => word.definition.trim() && word.word.trim());
    if (validWords.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un mot avec sa définition',
        variant: 'destructive',
      });
      return;
    }

    if (formData.timerDuration < 5 || formData.timerDuration > 300) {
      toast({
        title: 'Erreur',
        description: 'La durée du timer doit être entre 5 et 300 secondes',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const reverseDictionaryData: ReverseDictionaryData = {
        type: 'reverse_dictionary',
        title: formData.title,
        timerDuration: formData.timerDuration,
        words: validWords,
        thumbnailUrl: formData.thumbnailUrl
      };

      const { error } = await supabase
        .from('activities')
        .update({
          title: formData.title,
          iframe_code: JSON.stringify(reverseDictionaryData),
          thumbnail_url: formData.thumbnailUrl || null,
          sub_activity_tag_id: formData.subActivityTagId || null,
          shared_globally: formData.sharedGlobally
        })
        .eq('id', activityId);

      if (error) throw error;

      // Track update
      UserActionsService.trackUpdate('activity', 'reverse-dictionary-updated', formData.title, {
        action: 'reverse_dictionary_updated',
        wordsCount: validWords.length,
        timerDuration: formData.timerDuration,
        sharedGlobally: formData.sharedGlobally,
        subTagId: formData.subActivityTagId
      });

      toast({
        title: 'Succès',
        description: 'Dictionnaire inversé modifié avec succès',
      });

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la modification du dictionnaire inversé:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le dictionnaire inversé',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Modifier le dictionnaire inversé
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Titre du jeu (dictionnaire inversé) *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Dictionnaire inversé - Nature"
              required
            />
          </div>

          <ActivityThumbnailUploader
            currentThumbnail={formData.thumbnailUrl}
            onThumbnailChange={(url) => setFormData({ ...formData, thumbnailUrl: url || '' })}
          />

          <div>
            <Label htmlFor="timerDuration">Durée du compte à rebours en secondes *</Label>
            <Input
              id="timerDuration"
              type="number"
              min="5"
              max="300"
              value={formData.timerDuration}
              onChange={(e) => setFormData({ ...formData, timerDuration: parseInt(e.target.value) || 30 })}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Entre 5 et 300 secondes (5 minutes maximum)
            </p>
          </div>

          <SubActivitySelector
            activityType="games"
            selectedSubTagId={formData.subActivityTagId}
            onSubTagChange={(subTagId) => setFormData({ ...formData, subActivityTagId: subTagId || '' })}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="shared-globally"
              checked={formData.sharedGlobally}
              onCheckedChange={(checked) => setFormData({ ...formData, sharedGlobally: !!checked })}
            />
            <label
              htmlFor="shared-globally"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Partager avec tout le monde
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Mots à deviner</Label>
              <Button type="button" onClick={addWord} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un mot à deviner
              </Button>
            </div>

            {words.map((word, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">Mot #{index + 1}</Label>
                    {words.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeWord(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor={`definition-${index}`}>Définition du mot à deviner *</Label>
                    <Textarea
                      id={`definition-${index}`}
                      value={word.definition}
                      onChange={(e) => updateWord(index, 'definition', e.target.value)}
                      placeholder="Ex: Arbre aux feuilles caduques, symbole de force et de longévité..."
                      className="min-h-[80px]"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`word-${index}`}>Mot à deviner *</Label>
                    <Input
                      id={`word-${index}`}
                      value={word.word}
                      onChange={(e) => updateWord(index, 'word', e.target.value)}
                      placeholder="Ex: chêne"
                      required
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Modification...' : 'Modifier le dictionnaire inversé'}
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

export default EditReverseDictionaryForm;