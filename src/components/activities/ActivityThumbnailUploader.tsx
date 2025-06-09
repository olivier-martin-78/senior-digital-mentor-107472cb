
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface ActivityThumbnailUploaderProps {
  currentThumbnail?: string;
  onThumbnailChange: (url: string | null) => void;
}

const ActivityThumbnailUploader: React.FC<ActivityThumbnailUploaderProps> = ({
  currentThumbnail,
  onThumbnailChange
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentThumbnail || '');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier image',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('activity-thumbnails')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('activity-thumbnails')
        .getPublicUrl(fileName);

      if (data?.publicUrl) {
        setPreviewUrl(data.publicUrl);
        onThumbnailChange(data.publicUrl);
        toast({
          title: 'Succès',
          description: 'Vignette uploadée avec succès',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader la vignette',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveThumbnail = () => {
    setPreviewUrl('');
    onThumbnailChange(null);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="thumbnail">Vignette de l'activité</Label>
      
      {previewUrl ? (
        <div className="relative w-32 h-20">
          <img
            src={previewUrl}
            alt="Aperçu de la vignette"
            className="w-full h-full object-cover rounded-md"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveThumbnail}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-2">Aucune vignette sélectionnée</p>
        </div>
      )}
      
      <Input
        id="thumbnail"
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
        className="cursor-pointer"
      />
      
      {uploading && (
        <p className="text-sm text-blue-600">Upload en cours...</p>
      )}
    </div>
  );
};

export default ActivityThumbnailUploader;
