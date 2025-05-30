
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BlogAlbum } from '@/types/supabase';
import { Plus } from 'lucide-react';
import AlbumSelectorDropdown from './AlbumSelectorDropdown';
import NewAlbumForm from './NewAlbumForm';
import { useAlbumPermissions } from '@/hooks/blog/useAlbumPermissions';
import { useAlbumCreation } from '@/hooks/blog/useAlbumCreation';

interface AlbumSelectorProps {
  albumId: string | null;
  setAlbumId: (id: string | null) => void;
  allAlbums: BlogAlbum[];
  setAllAlbums: (albums: BlogAlbum[]) => void;
  userId: string | undefined;
}

const AlbumSelector: React.FC<AlbumSelectorProps> = ({
  albumId,
  setAlbumId,
  allAlbums,
  setAllAlbums,
  userId
}) => {
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const { accessibleAlbums, setAccessibleAlbums } = useAlbumPermissions(allAlbums);
  
  const {
    newAlbumName,
    setNewAlbumName,
    thumbnailPreview,
    uploadingThumbnail,
    handleThumbnailChange,
    createNewAlbum,
    resetForm
  } = useAlbumCreation(
    userId,
    allAlbums,
    setAllAlbums,
    setAccessibleAlbums,
    accessibleAlbums,
    setAlbumId
  );

  const handleCreateAlbum = async () => {
    const success = await createNewAlbum();
    if (success) {
      setIsCreatingAlbum(false);
    }
  };

  const handleCancel = () => {
    setIsCreatingAlbum(false);
    resetForm();
  };

  return (
    <div className="mb-6">
      <Label>Album <span className="text-red-500">*</span></Label>
      {isCreatingAlbum ? (
        <NewAlbumForm
          newAlbumName={newAlbumName}
          setNewAlbumName={setNewAlbumName}
          thumbnailPreview={thumbnailPreview}
          onThumbnailChange={handleThumbnailChange}
          onCreateAlbum={handleCreateAlbum}
          onCancel={handleCancel}
          uploadingThumbnail={uploadingThumbnail}
        />
      ) : (
        <div className="flex gap-2 mt-1">
          <AlbumSelectorDropdown
            albumId={albumId}
            setAlbumId={setAlbumId}
            accessibleAlbums={accessibleAlbums}
          />
          <Button 
            onClick={() => setIsCreatingAlbum(true)} 
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nouvel album
          </Button>
        </div>
      )}
    </div>
  );
};

export default AlbumSelector;
