
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface BlogSearchProps {
  onSearch: (searchTerm: string) => void;
  initialSearchTerm?: string;
}

const BlogSearch: React.FC<BlogSearchProps> = ({ onSearch, initialSearchTerm = '' }) => {
  const [searchInput, setSearchInput] = useState(initialSearchTerm);

  const handleSearch = () => {
    onSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    onSearch('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher des mots-clés dans les articles..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-10"
        />
        {searchInput && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button onClick={handleSearch} className="bg-tranches-sage hover:bg-tranches-sage/90">
        Rechercher
      </Button>
    </div>
  );
};

export default BlogSearch;
