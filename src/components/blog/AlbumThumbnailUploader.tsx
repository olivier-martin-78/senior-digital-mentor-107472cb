
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon } from 'lucide-react';

interface AlbumThumbnailUploaderProps {
  thumbnailPreview: string | null;
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AlbumThumbnailUploader: React.FC<AlbumThumbnailUploaderProps> = ({
  thumbnailPreview,
  onThumbnailChange
}) => {
  return (
    <div>
      <Label htmlFor="album-thumbnail" className="block mb-2">Vignette de l'album (optionnel)</Label>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden">
          {thumbnailPreview ? (
            <img 
              src={thumbnailPreview} 
              alt="Aperçu de la vignette" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div>
          <Input
            id="album-thumbnail"
            type="file"
            accept="image/*"
            onChange={onThumbnailChange}
            className="max-w-xs"
          />
          <p className="text-xs text-gray-500 mt-1">Format recommandé: JPEG ou PNG, max 2MB</p>
        </div>
      </div>
    </div>
  );
};

export default AlbumThumbnailUploader;
