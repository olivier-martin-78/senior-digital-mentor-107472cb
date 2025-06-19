
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BlogCategory } from '@/types/supabase';

interface BlogCategorySelectorProps {
  categories: BlogCategory[];
  selectedCategories: string[];
  onCategoryChange: (categoryId: string) => void;
}

const BlogCategorySelector: React.FC<BlogCategorySelectorProps> = ({
  categories,
  selectedCategories,
  onCategoryChange
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Filtrer par catégories</label>
      <Select onValueChange={onCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder="Ajouter une catégorie" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem 
              key={category.id} 
              value={category.id}
              disabled={selectedCategories.includes(category.id)}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCategories.map((categoryId) => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <Badge
                key={categoryId}
                variant="default"
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {category.name}
                <button
                  type="button"
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  onClick={() => onCategoryChange(categoryId)}
                >
                  ×
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

export default BlogCategorySelector;
