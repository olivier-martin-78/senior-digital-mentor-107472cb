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
    try {
      console.log(`🔍 ActivityCreatorToggle[${userId}]: fetchUserRoles() appelée`);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      console.log(`📊 ActivityCreatorToggle[${userId}]: Réponse DB:`, { data, error });

      if (error) throw error;

      const roles = data ? data.map(r => r.role) : [];
      const hasCreator = roles.includes('createur_activite');
      
      console.log(`✅ ActivityCreatorToggle[${userId}]: Rôles trouvés:`, { roles, hasCreator });
      
      setHasCreatorRole(hasCreator);
    } catch (error) {
      console.error(`❌ ActivityCreatorToggle[${userId}]: Erreur lors de la récupération des rôles:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(`🚀 ActivityCreatorToggle[${userId}]: useEffect mount/userId change`);
    fetchUserRoles();
  }, [userId]);

  const handleToggle = async (checked: boolean) => {
    console.log(`🔄 ActivityCreatorToggle[${userId}]: handleToggle appelée avec checked=${checked}`);
    setIsUpdating(true);
    
    try {
      if (checked) {
        console.log(`➕ ActivityCreatorToggle[${userId}]: Ajout du rôle createur_activite`);
        
        // Ajouter le rôle 'createur_activite'
        const { error } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: 'createur_activite' 
          });

        console.log(`📊 ActivityCreatorToggle[${userId}]: Réponse INSERT:`, { error });

        if (error) {
          // Si l'erreur est un conflit (rôle déjà existant), l'ignorer
          if (!error.message.includes('duplicate key value')) {
            throw error;
          }
          console.log(`⚠️ ActivityCreatorToggle[${userId}]: Rôle déjà existant, ignoré`);
        }

        setHasCreatorRole(true);
        toast({
          title: 'Habilitation accordée',
          description: 'L\'utilisateur peut maintenant créer des activités',
        });
      } else {
        console.log(`➖ ActivityCreatorToggle[${userId}]: Suppression du rôle createur_activite`);
        
        // Retirer le rôle 'createur_activite'
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'createur_activite');

        console.log(`📊 ActivityCreatorToggle[${userId}]: Réponse DELETE:`, { error });

        if (error) throw error;

        setHasCreatorRole(false);
        toast({
          title: 'Habilitation retirée',
          description: 'L\'utilisateur ne peut plus créer d\'activités',
        });
      }

      console.log(`🔄 ActivityCreatorToggle[${userId}]: Appel onRoleChange...`);
      if (onRoleChange) {
        onRoleChange();
      }
      
    } catch (error: any) {
      console.error(`❌ ActivityCreatorToggle[${userId}]: Erreur:`, error);
      toast({
        title: 'Erreur',
        description: `Impossible de modifier l'habilitation : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
      console.log(`✅ ActivityCreatorToggle[${userId}]: handleToggle terminée`);
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