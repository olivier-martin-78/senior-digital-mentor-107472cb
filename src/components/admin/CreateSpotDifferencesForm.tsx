import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, X } from 'lucide-react';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateSpotDifferencesFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface SpotDifferencesGameData {
  type: 'spot_differences';
  title: string;
  originalImageUrl: string;
  differencesImageUrl: string;
  differences: string[];
  thumbnailUrl?: string;
}

export const CreateSpotDifferencesForm: React.FC<CreateSpotDifferencesFormProps> = ({
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [selectedSubTagId, setSelectedSubTagId] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [sharedGlobally, setSharedGlobally] = useState(false);
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [differencesImage, setDifferencesImage] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [differencesImagePreview, setDifferencesImagePreview] = useState<string | null>(null);
  const [differences, setDifferences] = useState<string[]>(Array(7).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleOriginalImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setOriginalImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDifferencesImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDifferencesImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setDifferencesImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDifferenceChange = (index: number, value: string) => {
    const newDifferences = [...differences];
    newDifferences[index] = value;
    setDifferences(newDifferences);
  };

  const uploadImage = async (file: File, fileName: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const filePath = `${user.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('spot-differences-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('spot-differences-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !originalImage || !differencesImage) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier que toutes les différences sont remplies
    const filledDifferences = differences.filter(diff => diff.trim() !== '');
    if (filledDifferences.length !== 7) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les 7 différences.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Upload des images
      const originalImageUrl = await uploadImage(originalImage, `original-${Date.now()}.${originalImage.name.split('.').pop()}`);
      const differencesImageUrl = await uploadImage(differencesImage, `differences-${Date.now()}.${differencesImage.name.split('.').pop()}`);

      // Préparer les données du jeu
      const gameData: SpotDifferencesGameData = {
        type: 'spot_differences',
        title,
        originalImageUrl,
        differencesImageUrl,
        differences: filledDifferences,
        thumbnailUrl: thumbnailUrl || undefined,
      };

      // Insérer l'activité dans la base de données
      const { error } = await supabase
        .from('activities')
        .insert({
          title,
          activity_type: 'games',
          link: `/activities/spot-differences/${Date.now()}`,
          iframe_code: JSON.stringify(gameData),
          thumbnail_url: thumbnailUrl,
          shared_globally: sharedGlobally,
          sub_activity_tag_id: selectedSubTagId,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Jeu des 7 erreurs créé avec succès !",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erreur lors de la création du jeu:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du jeu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Créer un jeu des 7 erreurs
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre des 7 erreurs *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entrez le titre du jeu"
                  required
                />
              </div>

              <SubActivitySelector
                activityType="games"
                selectedSubTagId={selectedSubTagId}
                onSubTagChange={setSelectedSubTagId}
              />

              <div>
                <Label>Vignette de l'activité</Label>
                <ActivityThumbnailUploader
                  currentThumbnail={thumbnailUrl}
                  onThumbnailChange={setThumbnailUrl}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shared"
                  checked={sharedGlobally}
                  onCheckedChange={(checked) => setSharedGlobally(checked === true)}
                />
                <Label htmlFor="shared">Partager avec tout le monde</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="original-image">Image originale *</Label>
                <div className="mt-2">
                  <Input
                    id="original-image"
                    type="file"
                    accept="image/*"
                    onChange={handleOriginalImageChange}
                    required
                  />
                  {originalImagePreview && (
                    <div className="mt-2">
                      <img
                        src={originalImagePreview}
                        alt="Aperçu image originale"
                        className="max-w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="differences-image">Image contenant les 7 différences *</Label>
                <div className="mt-2">
                  <Input
                    id="differences-image"
                    type="file"
                    accept="image/*"
                    onChange={handleDifferencesImageChange}
                    required
                  />
                  {differencesImagePreview && (
                    <div className="mt-2">
                      <img
                        src={differencesImagePreview}
                        alt="Aperçu image avec différences"
                        className="max-w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Les 7 différences *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {differences.map((difference, index) => (
                <div key={index}>
                  <Label htmlFor={`difference-${index + 1}`}>Différence #{index + 1}</Label>
                  <Textarea
                    id={`difference-${index + 1}`}
                    value={difference}
                    onChange={(e) => handleDifferenceChange(index, e.target.value)}
                    placeholder={`Décrivez la différence #${index + 1}`}
                    className="resize-none"
                    rows={2}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le jeu
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};