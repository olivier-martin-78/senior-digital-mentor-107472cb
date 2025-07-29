import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useCanCreateActivities = () => {
  const { user, hasRole } = useAuth();
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      console.log('🔍 useCanCreateActivities: Vérification des permissions pour user:', user?.id);
      
      if (!user) {
        console.log('❌ useCanCreateActivities: Pas d\'utilisateur connecté');
        setCanCreate(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Vérifier d'abord si l'utilisateur est admin
        const isAdmin = hasRole('admin');
        console.log('🔍 useCanCreateActivities: Est admin?', isAdmin);
        
        if (isAdmin) {
          console.log('✅ useCanCreateActivities: Utilisateur admin - accès accordé');
          setCanCreate(true);
          setLoading(false);
          return;
        }

        // Utiliser la fonction Supabase pour vérifier les permissions
        console.log('🔍 useCanCreateActivities: Appel can_create_activities pour user:', user.id);
        const { data, error } = await supabase
          .rpc('can_create_activities', { user_id_param: user.id });

        console.log('📊 useCanCreateActivities: Réponse can_create_activities:', { data, error });

        if (error) {
          console.error('❌ useCanCreateActivities: Erreur lors de la vérification des permissions:', error);
          setCanCreate(false);
        } else {
          console.log(data ? '✅ useCanCreateActivities: Permissions accordées' : '❌ useCanCreateActivities: Permissions refusées');
          setCanCreate(data || false);
        }
      } catch (error) {
        console.error('❌ useCanCreateActivities: Erreur lors de la vérification des permissions:', error);
        setCanCreate(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user, hasRole]);

  return { canCreate, loading };
};