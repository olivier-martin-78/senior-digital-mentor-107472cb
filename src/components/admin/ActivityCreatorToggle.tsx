import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface ActivityCreatorToggleProps {
  userId: string;
  onRoleChange?: () => void;
}

const ActivityCreatorToggle: React.FC<ActivityCreatorToggleProps> = ({
  userId,
  onRoleChange,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasCreatorRole, setHasCreatorRole] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = async () => {
    console.log('🔄 ActivityCreatorToggle: fetchUserRoles appelée pour userId:', userId);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;

      const roles = data ? data.map(r => r.role) : [];
      const hasRole = roles.includes('createur_activite');
      console.log('✅ ActivityCreatorToggle: Rôles récupérés pour', userId, ':', roles, 'hasCreatorRole:', hasRole);
      setHasCreatorRole(hasRole);
    } catch (error) {
      console.error('❌ ActivityCreatorToggle: Erreur lors de la récupération des rôles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('⚡ ActivityCreatorToggle: useEffect déclenchée pour userId:', userId);
    fetchUserRoles();
  }, [userId]);

  const handleToggle = async (checked: boolean) => {
    console.log('🔄 ActivityCreatorToggle: handleToggle appelée pour userId:', userId, 'checked:', checked);
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

        setHasCreatorRole(true);
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

        setHasCreatorRole(false);
        toast({
          title: 'Habilitation retirée',
          description: 'L\'utilisateur ne peut plus créer d\'activités',
        });
      }
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

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

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