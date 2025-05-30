
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchFilterProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchTermChange
}) => {
  const handleClearSearch = () => {
    onSearchTermChange('');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <Label htmlFor="search" className="text-sm font-medium mb-2 block">
        Rechercher dans les entrées
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          id="search"
          type="text"
          placeholder="Rechercher par titre, activités ou réflexions..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            title="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
