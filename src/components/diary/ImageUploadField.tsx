
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
    
    console.log('📁 Nouveau fichier sélectionné:', file ? {
      name: file.name,
      type: file.type,
      size: file.size
    } : 'null');
    
    if (!file) {
      form.setValue('media', null);
      onMediaChange?.(null);
      return;
    }

    try {
      setIsProcessing(true);
      
      // Vérifier si c'est un fichier HEIC
      if (isHeicFile(file)) {
        console.log('📱 Fichier HEIC détecté, affichage du toast de conversion');
        toast({
          title: 'Conversion en cours',
          description: 'Conversion du fichier HEIC en cours, veuillez patienter...',
        });
        
        console.log('🔄 Début du processus de conversion HEIC');
        const convertedFile = await processImageFile(file);
        console.log('✅ Conversion HEIC terminée avec succès');
        
        form.setValue('media', convertedFile);
        onMediaChange?.(convertedFile);
        
        toast({
          title: 'Conversion réussie',
          description: `Le fichier HEIC a été converti en JPEG (${Math.round(convertedFile.size / 1024)}KB).`,
        });
      } else {
        console.log('📄 Fichier standard, traitement direct');
        const processedFile = await processImageFile(file);
        form.setValue('media', processedFile);
        onMediaChange?.(processedFile);
      }
    } catch (error: any) {
      console.error('💥 Erreur critique lors du traitement du fichier:', {
        error,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size,
        errorMessage: error?.message,
        errorStack: error?.stack
      });
      
      toast({
        title: 'Erreur de conversion',
        description: error.message || 'Impossible de traiter le fichier sélectionné. Essayez avec un fichier JPEG ou PNG.',
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
            {isProcessing && <div className="text-blue-600 font-medium mt-1">⏳ Conversion en cours...</div>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ImageUploadField;
