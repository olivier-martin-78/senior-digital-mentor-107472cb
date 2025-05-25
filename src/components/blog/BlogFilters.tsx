
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { BlogAlbum, BlogCategory } from '@/types/supabase';

interface BlogFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAlbum: string | null;
  setSelectedAlbum: (albumId: string | null) => void;
  selectedCategories: string[];
  toggleCategorySelection: (categoryId: string) => void;
  albums: BlogAlbum[];
  categories: BlogCategory[];
}

const BlogFilters: React.FC<BlogFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedAlbum,
  setSelectedAlbum,
  selectedCategories,
  toggleCategorySelection,
  albums,
  categories
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
          <SelectTrigger className="w-full md:w-1/4">
            <SelectValue placeholder="Tous les albums" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les albums</SelectItem>
            {albums.map(album => (
              <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Categories filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 pt-1">Filtrer par catégorie:</span>
          {categories.map(category => (
            <Badge 
              key={category.id} 
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleCategorySelection(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogFilters;
