
import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { processImageFile, isHeicFile } from '@/utils/imageUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ImageUploadFieldProps {
  form: UseFormReturn<any>;
  onMediaChange?: (file: File | null) => void;
  disabled?: boolean;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  form,
  onMediaChange,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) {
      form.setValue('media', null);
      onMediaChange?.(null);
      return;
    }

    try {
      setIsProcessing(true);
      
      // Vérifier si c'est un fichier HEIC
      if (isHeicFile(file)) {
        toast({
          title: 'Conversion en cours',
          description: 'Conversion du fichier HEIC en cours...',
        });
        
        const convertedFile = await processImageFile(file);
        form.setValue('media', convertedFile);
        onMediaChange?.(convertedFile);
        
        toast({
          title: 'Conversion réussie',
          description: 'Le fichier HEIC a été converti en JPEG.',
        });
      } else {
        form.setValue('media', file);
        onMediaChange?.(file);
      }
    } catch (error: any) {
      console.error('Erreur lors du traitement du fichier:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de traiter le fichier sélectionné.',
        variant: 'destructive',
      });
      
      // Réinitialiser le champ de fichier
      e.target.value = '';
      form.setValue('media', null);
      onMediaChange?.(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <FormField
      control={form.control}
      name="media"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            Média (photo/vidéo)
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
          </FormLabel>
          <FormControl>
            <Input
              type="file"
              accept="image/*,video/*,audio/*,.heic,.heif"
              onChange={handleFileChange}
              disabled={disabled || isProcessing}
            />
          </FormControl>
          <div className="text-xs text-gray-500">
            Formats supportés : JPEG, PNG, GIF, WebP, HEIC, MP4, MOV, MP3, WAV
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ImageUploadField;
