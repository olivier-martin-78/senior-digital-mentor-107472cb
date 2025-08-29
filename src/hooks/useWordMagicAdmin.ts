import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WordMagicLevel, GridCell } from '@/types/wordMagicGame';

interface CreateLevelData {
  level_number: number;
  letters: string;
  grid_layout: GridCell[][];
  solutions: string[];
  bonus_words: string[];
  difficulty: 'facile' | 'moyen' | 'difficile';
}

interface UpdateLevelData extends CreateLevelData {
  id: string;
}

export const useWordMagicAdmin = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const createLevelMutation = useMutation({
    mutationFn: async (levelData: CreateLevelData) => {
      const { data, error } = await supabase
        .from('word_magic_levels')
        .insert({
          level_number: levelData.level_number,
          letters: levelData.letters,
          grid_layout: levelData.grid_layout as any,
          solutions: levelData.solutions as any,
          bonus_words: levelData.bonus_words as any,
          difficulty: levelData.difficulty
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word-magic-levels'] });
      toast.success('Niveau créé avec succès !');
    },
    onError: (error: any) => {
      console.error('Error creating level:', error);
      toast.error('Erreur lors de la création du niveau');
    },
  });

  const updateLevelMutation = useMutation({
    mutationFn: async (levelData: UpdateLevelData) => {
      const { data, error } = await supabase
        .from('word_magic_levels')
        .update({
          level_number: levelData.level_number,
          letters: levelData.letters,
          grid_layout: levelData.grid_layout as any,
          solutions: levelData.solutions as any,
          bonus_words: levelData.bonus_words as any,
          difficulty: levelData.difficulty,
          updated_at: new Date().toISOString()
        })
        .eq('id', levelData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word-magic-levels'] });
      toast.success('Niveau modifié avec succès !');
    },
    onError: (error: any) => {
      console.error('Error updating level:', error);
      toast.error('Erreur lors de la modification du niveau');
    },
  });

  const deleteLevelMutation = useMutation({
    mutationFn: async (levelId: string) => {
      const { error } = await supabase
        .from('word_magic_levels')
        .delete()
        .eq('id', levelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word-magic-levels'] });
      toast.success('Niveau supprimé avec succès !');
    },
    onError: (error: any) => {
      console.error('Error deleting level:', error);
      toast.error('Erreur lors de la suppression du niveau');
    },
  });

  const createLevel = async (levelData: CreateLevelData) => {
    setIsSubmitting(true);
    try {
      await createLevelMutation.mutateAsync(levelData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLevel = async (levelData: UpdateLevelData) => {
    setIsSubmitting(true);
    try {
      await updateLevelMutation.mutateAsync(levelData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteLevel = async (levelId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce niveau ? Cette action est irréversible.')) {
      await deleteLevelMutation.mutateAsync(levelId);
    }
  };

  const validateLevel = (levelData: Partial<CreateLevelData>): string[] => {
    const errors: string[] = [];

    if (!levelData.level_number || levelData.level_number < 1) {
      errors.push('Le numéro de niveau doit être supérieur à 0');
    }

    if (!levelData.letters || levelData.letters.trim().length === 0) {
      errors.push('Les lettres sont obligatoires');
    }

    if (!levelData.grid_layout || levelData.grid_layout.length === 0) {
      errors.push('La grille doit contenir au moins une ligne');
    }

    if (!levelData.solutions || levelData.solutions.length === 0) {
      errors.push('Au moins une solution est requise');
    }

    if (!levelData.difficulty) {
      errors.push('La difficulté est obligatoire');
    }

    // Validation des lettres disponibles vs grille
    if (levelData.letters && levelData.grid_layout) {
      const availableLetters = levelData.letters.split(',').map(l => l.trim().toUpperCase());
      const gridLetters: string[] = [];
      
      levelData.grid_layout.forEach(row => {
        row.forEach(cell => {
          if (cell.letter && cell.letter.trim() !== '') {
            gridLetters.push(cell.letter.toUpperCase());
          }
        });
      });

      const letterCounts: { [key: string]: number } = {};
      availableLetters.forEach(letter => {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
      });

      gridLetters.forEach(letter => {
        if (letterCounts[letter]) {
          letterCounts[letter]--;
        } else {
          errors.push(`La lettre "${letter}" dans la grille n'est pas disponible dans les lettres fournies`);
        }
      });
    }

    return errors;
  };

  return {
    createLevel,
    updateLevel,
    deleteLevel,
    validateLevel,
    isSubmitting,
    isCreating: createLevelMutation.isPending,
    isUpdating: updateLevelMutation.isPending,
    isDeleting: deleteLevelMutation.isPending,
  };
};