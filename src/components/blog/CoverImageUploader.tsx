
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageIcon, X } from 'lucide-react';
import { processImageFile } from '@/utils/imageUtils';
import { useToast } from '@/hooks/use-toast';

interface CoverImageUploaderProps {
  coverImage: string | null;
  setCoverImage: (url: string | null) => void;
  setCoverImageFile: (file: File | null) => void;
  uploadingCoverImage: boolean;
}

const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  coverImage,
  setCoverImage,
  setCoverImageFile,
  uploadingCoverImage
}) => {
  const { toast } = useToast();

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        console.log('🖼️ Début du traitement de la miniature:', file.name);
        
        // Traiter le fichier (conversion HEIC si nécessaire)
        const processedFile = await processImageFile(file);
        
        setCoverImageFile(processedFile);
        
        // Créer l'URL de prévisualisation avec le fichier traité
        const previewUrl = URL.createObjectURL(processedFile);
        setCoverImage(previewUrl);
        
        console.log('✅ Miniature traitée avec succès:', {
          originalName: file.name,
          processedName: processedFile.name,
          originalSize: file.size,
          processedSize: processedFile.size
        });
        
        // Libérer l'URL de l'objet lorsque le composant est démonté
        return () => URL.revokeObjectURL(previewUrl);
      } catch (error) {
        console.error('❌ Erreur lors du traitement de la miniature:', error);
        toast({
          title: "Erreur de traitement",
          description: error instanceof Error ? error.message : "Impossible de traiter l'image",
          variant: "destructive"
        });
        
        // Réinitialiser l'input en cas d'erreur
        e.target.value = '';
      }
    }
  };

  return (
    <div className="mb-6">
      <Label htmlFor="cover-image">Miniature de l'article</Label>
      <div className="flex items-center gap-4 mt-2">
        <div className="relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
          {coverImage ? (
            <img 
              src={coverImage} 
              alt="Miniature de l'article" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
          {coverImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCoverImage(null);
                setCoverImageFile(null);
              }}
              className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div>
          <Input
            id="cover-image"
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
            className="max-w-xs"
            disabled={uploadingCoverImage}
          />
          <p className="text-xs text-gray-500 mt-1">Format recommandé: JPEG ou PNG, max 2MB</p>
          <p className="text-xs text-gray-400 mt-1">Les images HEIC seront automatiquement converties en JPEG</p>
        </div>
      </div>
    </div>
  );
};

export default CoverImageUploader;
