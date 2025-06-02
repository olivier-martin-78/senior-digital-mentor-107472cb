
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDisplayNameValidation = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkDisplayNameUniqueness = async (displayName: string): Promise<boolean> => {
    if (!displayName || displayName.trim().length === 0) {
      return true; // Nom vide autorisé
    }

    setIsChecking(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('display_name', displayName.trim())
        .maybeSingle();

      if (error) {
        console.error('Erreur lors de la vérification du nom public:', error);
        toast({
          title: "Erreur de validation",
          description: "Impossible de vérifier l'unicité du nom public. Veuillez réessayer.",
          variant: "destructive"
        });
        return false;
      }

      if (data) {
        toast({
          title: "Nom déjà utilisé",
          description: "Ce nom public est déjà utilisé par un autre utilisateur. Veuillez en choisir un autre.",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification du nom public:', error);
      toast({
        title: "Erreur de validation",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkDisplayNameUniqueness,
    isChecking
  };
};
