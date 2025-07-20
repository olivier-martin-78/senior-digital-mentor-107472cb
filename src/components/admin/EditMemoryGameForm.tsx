import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity } from '@/hooks/useActivities';
import SubActivitySelector from "@/components/activities/SubActivitySelector";

interface EditMemoryGameFormProps {
  activity: Activity;
  onSave: () => void;
  onCancel: () => void;
}

export const EditMemoryGameForm: React.FC<EditMemoryGameFormProps> = ({ 
  activity,
  onSave, 
  onCancel 
}) => {
  const { toast } = useToast();
  
  // Parse les données du jeu Memory
  const gameData = activity.iframe_code ? JSON.parse(activity.iframe_code) : null;
  
  const [title, setTitle] = useState(gameData?.title || "");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>(gameData?.images || []);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(activity.thumbnail_url || null);
  const [selectedSubTagId, setSelectedSubTagId] = useState<string | null>(activity.sub_activity_tag_id);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length + currentImages.length > 14) {
      toast({
        title: "Trop d'images",
        description: "Vous ne pouvez avoir que 14 images maximum au total.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeCurrentImage = (index: number) => {
    setCurrentImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setCurrentThumbnail(null); // On va remplacer l'ancienne
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setCurrentThumbnail(null);
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('memory_game_images')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Erreur upload: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('memory_game_images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Titre manquant",
        description: "Veuillez saisir un titre pour la série.",
        variant: "destructive",
      });
      return;
    }

    if (currentImages.length + selectedFiles.length < 2) {
      toast({
        title: "Images insuffisantes",
        description: "Veuillez conserver au moins 2 images.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload nouvelles images
      const newImageUrls = await Promise.all(
        selectedFiles.map(file => uploadImageToStorage(file))
      );

      // Combiner images existantes et nouvelles
      const allImageUrls = [...currentImages, ...newImageUrls];

      // Upload thumbnail si fourni
      let thumbnailUrl = currentThumbnail;
      if (thumbnailFile) {
        thumbnailUrl = await uploadImageToStorage(thumbnailFile);
      }

      // Mettre à jour les données du jeu
      const updatedGameData = {
        title: title.trim(),
        images: allImageUrls,
        created_at: gameData?.created_at || new Date().toISOString(),
        type: 'memory_game'
      };

      // Mettre à jour l'activité
      const { error } = await supabase
        .from('activities')
        .update({
          title: title,
          iframe_code: JSON.stringify(updatedGameData),
          thumbnail_url: thumbnailUrl,
          sub_activity_tag_id: selectedSubTagId,
        })
        .eq('id', activity.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Série modifiée avec succès",
        description: `La série "${title}" a été modifiée avec ${allImageUrls.length} images.`,
      });

      onSave();

    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de la série.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Modifier la série Memory
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
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Modification :</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Modifiez le titre de votre série</li>
              <li>• Supprimez des images existantes si nécessaire</li>
              <li>• Ajoutez de nouvelles images (maximum 14 au total)</li>
              <li>• Changez l'image de couverture</li>
            </ul>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="memory-title">Titre de la série</Label>
              <Input
                id="memory-title"
                placeholder="Ex: Animaux de la ferme"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <SubActivitySelector
                activityType="games"
                selectedSubTagId={selectedSubTagId}
                onSubTagChange={setSelectedSubTagId}
              />
            </div>

            <div className="space-y-2">
              <Label>Image de couverture</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                  id="thumbnail-upload"
                />
                {!thumbnailFile && !currentThumbnail ? (
                  <label htmlFor="thumbnail-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Plus className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Cliquez pour ajouter une image de couverture
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : currentThumbnail!}
                      alt="Aperçu"
                      className="w-24 h-24 object-cover rounded"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 h-6 w-6 p-0"
                      onClick={removeThumbnail}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Images existantes */}
            {currentImages.length > 0 && (
              <div className="space-y-2">
                <Label>Images actuelles ({currentImages.length})</Label>
                <div className="grid grid-cols-4 gap-2">
                  {currentImages.map((imageUrl, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-2">
                        <img
                          src={imageUrl}
                          alt={`Image ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-6 w-6 p-0"
                          onClick={() => removeCurrentImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Ajouter des images ({currentImages.length + selectedFiles.length}/14)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="memory-file-upload"
                />
                <label htmlFor="memory-file-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Cliquez pour ajouter des images
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Formats supportés: JPG, PNG, GIF
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Nouvelles images ({selectedFiles.length}):
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedFiles.map((file, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="p-2">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-1 -right-1 h-6 w-6 p-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {file.name}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleSubmit}
                disabled={isUploading || !title.trim() || (currentImages.length + selectedFiles.length < 2)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? "Modification en cours..." : "Sauvegarder"}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};