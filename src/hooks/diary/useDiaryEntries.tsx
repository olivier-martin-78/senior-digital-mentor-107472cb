
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryEntry } from '@/types/diary';
import { useToast } from '@/hooks/use-toast';
import { useGroupPermissions } from '../useGroupPermissions';

export const useDiaryEntries = (searchTerm: string = '', startDate: string = '', endDate: string = '', entryId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  useEffect(() => {
    // Si nous cherchons une entrée spécifique avec l'ID "new", ne pas faire de requête
    if (entryId === 'new') {
      setLoading(false);
      return;
    }

    const fetchEntries = async () => {
      if (!user || permissionsLoading) {
        setEntries([]);
        setLoading(false);
        return;
      }

      if (authorizedUserIds.length === 0) {
        console.log('⚠️ useDiaryEntries - Aucun utilisateur autorisé');
        setEntries([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        console.log('🔍 useDiaryEntries - Récupération avec permissions de groupe');
        console.log('✅ useDiaryEntries - Utilisateurs autorisés:', authorizedUserIds);

        let query = supabase
          .from('diary_entries')
          .select('*')
          .in('user_id', authorizedUserIds)
          .order('entry_date', { ascending: false });

        // Si nous cherchons une entrée spécifique
        if (entryId && entryId !== 'new') {
          query = query.eq('id', entryId);
        }

        // Filtrer par terme de recherche
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,activities.ilike.%${searchTerm}%`);
        }

        // Filtrer par plage de dates
        if (startDate) {
          query = query.gte('entry_date', startDate);
        }
        if (endDate) {
          query = query.lte('entry_date', endDate);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        console.log('✅ useDiaryEntries - Entrées récupérées:', data?.length || 0);
        setEntries(data as DiaryEntry[]);
      } catch (error: any) {
        console.error('❌ useDiaryEntries - Erreur lors du chargement des entrées:', error);
        
        // Si nous cherchons une entrée spécifique, afficher un message d'erreur spécifique
        if (entryId) {
          toast({
            title: 'Erreur',
            description: 'Impossible de récupérer cette entrée du journal',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les entrées du journal',
            variant: 'destructive',
          });
        }
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    if (!permissionsLoading) {
      fetchEntries();
    }
  }, [searchTerm, startDate, endDate, entryId, authorizedUserIds, permissionsLoading, user, toast]);

  return { entries, loading, refetch: () => {
    if (entryId !== 'new') {
      // Recharger les données si ce n'est pas une nouvelle entrée
      setLoading(true);
    }
  }};
};
