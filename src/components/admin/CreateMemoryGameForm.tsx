import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SubActivitySelector from "@/components/activities/SubActivitySelector";

interface CreateMemoryGameFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateMemoryGameForm: React.FC<CreateMemoryGameFormProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const [title, setTitle] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [selectedSubTagId, setSelectedSubTagId] = useState<string | null>(null);
  const [sharedGlobally, setSharedGlobally] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length > 14) {
      toast({
        title: "Trop d'images",
        description: "Vous ne pouvez sélectionner que 14 images maximum.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
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

    if (selectedFiles.length < 2) {
      toast({
        title: "Images insuffisantes",
        description: "Veuillez sélectionner au moins 2 images.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload all images
      const imageUrls = await Promise.all(
        selectedFiles.map(file => uploadImageToStorage(file))
      );

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        thumbnailUrl = await uploadImageToStorage(thumbnailFile);
      }

      // Create the memory game series (you might want to create a specific table for this)
      const gameData = {
        title: title.trim(),
        images: imageUrls,
        created_at: new Date().toISOString(),
        type: 'memory_game'
      };

      // For now, we'll store it as an activity with a special type
      const { error } = await supabase
        .from('activities')
        .insert({
          title: title,
          activity_type: 'games',
          link: '#', // Could be a link to the game with the series ID
          iframe_code: JSON.stringify(gameData),
          thumbnail_url: thumbnailUrl,
          sub_activity_tag_id: selectedSubTagId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          shared_globally: sharedGlobally
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Série créée avec succès",
        description: `La série "${title}" a été créée avec ${imageUrls.length} images.`,
      });

      // Reset form
      setTitle("");
      setSelectedFiles([]);
      setThumbnailFile(null);
      setSelectedSubTagId(null);
      setSharedGlobally(false);
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la série.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions :</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Donnez un titre descriptif à votre série (ex: "Animaux de la ferme")</li>
          <li>• Sélectionnez entre 2 et 14 images</li>
          <li>• Les images seront utilisées pour créer des paires à retrouver</li>
          <li>• Une fois créée, la série sera disponible pour tous les utilisateurs</li>
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

        <div className="flex items-center space-x-2">
          <Checkbox
            id="shared-globally"
            checked={sharedGlobally}
            onCheckedChange={(checked) => setSharedGlobally(!!checked)}
          />
          <label
            htmlFor="shared-globally"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Partager avec tout le monde
          </label>
        </div>

        <div className="space-y-2">
          <Label>Image de couverture (optionnelle)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              className="hidden"
              id="thumbnail-upload"
            />
            {!thumbnailFile ? (
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
                  src={URL.createObjectURL(thumbnailFile)}
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
        
        <div className="space-y-2">
          <Label>Images (2 à 14 images)</Label>
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
                    Cliquez pour sélectionner des images
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Formats supportés: JPG, PNG, GIF (max 14 images)
                  </p>
                </div>
              </div>
            </label>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">
                Images sélectionnées ({selectedFiles.length}/14):
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
            disabled={isUploading || !title.trim() || selectedFiles.length < 2}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? "Création en cours..." : "Créer la série"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
};