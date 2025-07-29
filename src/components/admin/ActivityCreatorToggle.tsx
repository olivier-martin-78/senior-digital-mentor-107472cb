import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface ActivityCreatorToggleProps {
  userId: string;
  currentRoles: AppRole[];
  onRoleChange: () => void;
}

const ActivityCreatorToggle: React.FC<ActivityCreatorToggleProps> = ({
  userId,
  currentRoles,
  onRoleChange,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const hasCreatorRole = currentRoles.includes('createur_activite');

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    
    try {
      if (checked) {
        // Ajouter le rôle 'createur_activite'
        const { error } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: 'createur_activite' 
          });

        if (error) {
          // Si l'erreur est un conflit (rôle déjà existant), l'ignorer
          if (!error.message.includes('duplicate key value')) {
            throw error;
          }
        }

        toast({
          title: 'Habilitation accordée',
          description: 'L\'utilisateur peut maintenant créer des activités',
        });
      } else {
        // Retirer le rôle 'createur_activite'
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'createur_activite');

        if (error) throw error;

        toast({
          title: 'Habilitation retirée',
          description: 'L\'utilisateur ne peut plus créer d\'activités',
        });
      }

      onRoleChange();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de modifier l'habilitation : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`creator-${userId}`}
        checked={hasCreatorRole}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
      <label 
        htmlFor={`creator-${userId}`} 
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Créateur activité
      </label>
      {isUpdating && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

export default ActivityCreatorToggle;