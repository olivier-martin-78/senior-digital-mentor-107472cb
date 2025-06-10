
import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { processImageFile, isHeicFile } from '@/utils/imageUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';

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
    
    console.log('📁 Nouveau fichier sélectionné:', file ? JSON.stringify({
      name: file.name,
      type: file.type,
      size: Math.round(file.size / 1024) + 'KB',
      lastModified: new Date(file.lastModified).toISOString()
    }) : 'null');
    
    if (!file) {
      form.setValue('media', null);
      onMediaChange?.(null);
      return;
    }

    try {
      setIsProcessing(true);
      
      // Vérifier si c'est un fichier HEIC et afficher un toast informatif
      if (isHeicFile(file)) {
        console.log('📱 Fichier HEIC détecté, démarrage de la conversion');
        toast({
          title: 'Conversion en cours',
          description: 'Conversion du fichier HEIC en cours, cela peut prendre quelques secondes...',
        });
      }
      
      // Traiter le fichier (conversion si nécessaire)
      console.log('🔄 Début du traitement du fichier');
      const processedFile = await processImageFile(file);
      console.log('✅ Traitement du fichier terminé avec succès');
      
      // Mettre à jour le formulaire
      form.setValue('media', processedFile);
      onMediaChange?.(processedFile);
      
      // Toast de succès pour les conversions HEIC
      if (isHeicFile(file)) {
        toast({
          title: 'Conversion réussie',
          description: `Le fichier a été converti avec succès (${Math.round(processedFile.size / 1024)}KB).`,
        });
      }
      
    } catch (error: any) {
      console.error('💥 Erreur lors du traitement du fichier:', JSON.stringify({
        errorName: error?.name || 'Unknown',
        errorMessage: error?.message || 'Unknown error',
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size
      }));
      
      // Toast d'erreur avec message détaillé
      toast({
        title: 'Erreur de traitement',
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
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          </FormLabel>
          <FormControl>
            <Input
              type="file"
              accept="image/*,video/*,audio/*,.heic,.heif"
              onChange={handleFileChange}
              disabled={disabled || isProcessing}
              className={isProcessing ? 'opacity-50' : ''}
            />
          </FormControl>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Formats supportés : JPEG, PNG, GIF, WebP, HEIC, MP4, MOV, MP3, WAV</div>
            <div className="text-orange-600 font-medium">
              📱 iPhone : Pour éviter les problèmes HEIC, activez "Plus compatible" dans Réglages > Appareil photo > Formats
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <Loader2 className="h-3 w-3 animate-spin" />
                Conversion HEIC en cours...
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ImageUploadField;
