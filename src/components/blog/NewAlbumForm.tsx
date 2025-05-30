
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Loader2, X } from 'lucide-react';
import AlbumThumbnailUploader from './AlbumThumbnailUploader';

interface NewAlbumFormProps {
  newAlbumName: string;
  setNewAlbumName: (name: string) => void;
  thumbnailPreview: string | null;
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateAlbum: () => void;
  onCancel: () => void;
  uploadingThumbnail: boolean;
}

const NewAlbumForm: React.FC<NewAlbumFormProps> = ({
  newAlbumName,
  setNewAlbumName,
  thumbnailPreview,
  onThumbnailChange,
  onCreateAlbum,
  onCancel,
  uploadingThumbnail
}) => {
  return (
    <div className="space-y-4 mt-1">
      <div className="flex gap-2">
        <Input
          type="text"
          value={newAlbumName}
          onChange={(e) => setNewAlbumName(e.target.value)}
          placeholder="Nom du nouvel album"
          className="flex-1"
        />
        <Button 
          onClick={onCreateAlbum} 
          className="bg-tranches-sage hover:bg-tranches-sage/90"
          size="sm"
          disabled={uploadingThumbnail}
        >
          {uploadingThumbnail ? 
            <Loader2 className="h-4 w-4 animate-spin" /> : 
            <Check className="h-4 w-4" />
          }
        </Button>
        <Button 
          onClick={onCancel} 
          variant="outline"
          size="sm"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <AlbumThumbnailUploader
        thumbnailPreview={thumbnailPreview}
        onThumbnailChange={onThumbnailChange}
      />
    </div>
  );
};

export default NewAlbumForm;
