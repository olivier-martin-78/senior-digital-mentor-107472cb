import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useCanCreateActivities = () => {
  const { user, hasRole } = useAuth();
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setCanCreate(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Vérifier d'abord si l'utilisateur est admin
        if (hasRole('admin')) {
          setCanCreate(true);
          setLoading(false);
          return;
        }

        // Utiliser la fonction Supabase pour vérifier les permissions
        const { data, error } = await supabase
          .rpc('can_create_activities', { user_id_param: user.id });

        if (error) {
          console.error('Erreur lors de la vérification des permissions:', error);
          setCanCreate(false);
        } else {
          setCanCreate(data || false);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des permissions:', error);
        setCanCreate(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user, hasRole]);

  return { canCreate, loading };
};