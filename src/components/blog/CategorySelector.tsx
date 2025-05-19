
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { BlogCategory } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CategorySelectorProps {
  allCategories: BlogCategory[];
  setAllCategories: (categories: BlogCategory[]) => void;
  selectedCategories: BlogCategory[];
  setSelectedCategories: (categories: BlogCategory[]) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  allCategories,
  setAllCategories,
  selectedCategories,
  setSelectedCategories
}) => {
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState('');

  const toggleCategory = (category: BlogCategory) => {
    setSelectedCategories((prev: BlogCategory[]) => {
      const isSelected = prev.some(c => c.id === category.id);
      if (isSelected) {
        return prev.filter(c => c.id !== category.id);
      } else {
        return [...prev, category];
      }
    });
  };

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .insert({
          name: newCategoryName.trim()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          const existingCategory = allCategories.find(c => 
            c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
          );
          
          if (existingCategory && !selectedCategories.some(c => c.id === existingCategory.id)) {
            setSelectedCategories([...selectedCategories, existingCategory]);
          }
          
          setNewCategoryName('');
          return;
        }
        throw error;
      }

      const newCategory = data as BlogCategory;
      setAllCategories([...allCategories, newCategory]);
      setSelectedCategories([...selectedCategories, newCategory]);
      setNewCategoryName('');
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la catégorie.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="mb-6">
      <Label>Catégories</Label>
      <div className="mt-2 flex flex-wrap gap-2 mb-2">
        {allCategories.map(category => (
          <Badge 
            key={category.id}
            variant={selectedCategories.some(c => c.id === category.id) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleCategory(category)}
          >
            {category.name}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Ajouter une nouvelle catégorie"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newCategoryName.trim()) {
              e.preventDefault();
              createNewCategory();
            }
          }}
        />
        <Button 
          onClick={createNewCategory} 
          disabled={!newCategoryName.trim()}
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CategorySelector;
