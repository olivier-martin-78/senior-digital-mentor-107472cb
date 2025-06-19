
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { BlogAlbum } from '@/types/supabase';

interface BlogFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAlbum: string | null;
  setSelectedAlbum: (albumId: string | null) => void;
  albums: BlogAlbum[];
}

const BlogFilters: React.FC<BlogFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedAlbum,
  setSelectedAlbum,
  albums
}) => {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedAlbum || 'all'} onValueChange={(value) => setSelectedAlbum(value === 'all' ? null : value)}>
          <SelectTrigger className="w-full md:w-1/3">
            <SelectValue placeholder="Sélectionner un album" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les albums</SelectItem>
            {albums.map(album => (
              <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BlogFilters;
