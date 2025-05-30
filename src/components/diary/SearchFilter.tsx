
import React, { useState } from 'react';
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
  const [inputValue, setInputValue] = useState(searchTerm);

  // Sécuriser l'input pour éviter les injections XSS
  const sanitizeInput = (input: string): string => {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const handleSearch = () => {
    const sanitizedInput = sanitizeInput(inputValue.trim());
    if (sanitizedInput.length <= 100) { // Limite de longueur
      onSearchTermChange(sanitizedInput);
    }
  };

  const handleClearSearch = () => {
    setInputValue('');
    onSearchTermChange('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Bloquer les caractères potentiellement dangereux
    if (!/[<>"]/.test(value)) {
      setInputValue(value);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <Label htmlFor="search" className="text-sm font-medium mb-2 block">
        Rechercher dans les entrées
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="search"
            type="text"
            placeholder="Rechercher par titre, activités ou réflexions..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-10"
            maxLength={100}
            autoComplete="off"
          />
          {inputValue && (
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
        <Button onClick={handleSearch} variant="default">
          <Search className="h-4 w-4 mr-2" />
          Rechercher
        </Button>
      </div>
    </div>
  );
};

export default SearchFilter;
