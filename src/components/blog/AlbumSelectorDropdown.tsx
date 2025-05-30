
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlogAlbum } from '@/types/supabase';

interface AlbumSelectorDropdownProps {
  albumId: string | null;
  setAlbumId: (id: string | null) => void;
  accessibleAlbums: BlogAlbum[];
}

const AlbumSelectorDropdown: React.FC<AlbumSelectorDropdownProps> = ({
  albumId,
  setAlbumId,
  accessibleAlbums
}) => {
  return (
    <Select value={albumId || ''} onValueChange={(value) => setAlbumId(value === '' ? null : value)}>
      <SelectTrigger className="flex-1">
        <SelectValue placeholder="Sélectionner un album (obligatoire)" />
      </SelectTrigger>
      <SelectContent>
        {accessibleAlbums.length === 0 ? (
          <SelectItem value="no-albums" disabled>
            Aucun album accessible - créez-en un nouveau
          </SelectItem>
        ) : (
          accessibleAlbums.map(album => (
            <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default AlbumSelectorDropdown;
