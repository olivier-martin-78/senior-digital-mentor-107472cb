
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { supabase } from '@/integrations/supabase/client';

export const useDiaryEntries = (searchTerm: string, startDate: string, endDate: string) => {
  const { user, getEffectiveUserId } = useAuth();
  const [entries, setEntries] = useState<DiaryEntryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log('🚫 useDiaryEntries - Pas d\'utilisateur connecté');
      setEntries([]);
      setLoading(false);
      return;
    }
    
    fetchEntries();
  }, [user, searchTerm, startDate, endDate]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 useDiaryEntries - Récupération avec logique applicative stricte');
      
      const effectiveUserId = getEffectiveUserId();
      console.log('👤 useDiaryEntries - Utilisateur courant:', effectiveUserId);

      // 1. Récupérer UNIQUEMENT les groupes où l'utilisateur est membre
      const { data: userGroups, error: userGroupsError } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', effectiveUserId);

      if (userGroupsError) {
        console.error('❌ useDiaryEntries - Erreur récupération groupes utilisateur:', userGroupsError);
        setEntries([]);
        setLoading(false);
        return;
      }

      const userGroupIds = userGroups?.map(g => g.group_id) || [];
      console.log('👥 useDiaryEntries - Groupes de l\'utilisateur:', {
        count: userGroupIds.length,
        groups: userGroups
      });

      // 2. Si l'utilisateur n'a pas de groupes, il ne voit QUE ses propres contenus
      let authorizedUserIds = [effectiveUserId];

      if (userGroupIds.length > 0) {
        const { data: groupMembers, error: groupMembersError } = await supabase
          .from('group_members')
          .select('user_id, group_id, role')
          .in('group_id', userGroupIds);

        if (groupMembersError) {
          console.error('❌ useDiaryEntries - Erreur récupération membres groupes:', groupMembersError);
        } else {
          console.log('👥 useDiaryEntries - Tous les membres des groupes:', groupMembers);
          
          const additionalUserIds = groupMembers?.map(gm => gm.user_id).filter(id => id !== effectiveUserId) || [];
          authorizedUserIds = [...authorizedUserIds, ...additionalUserIds];
          
          // Supprimer les doublons
          authorizedUserIds = [...new Set(authorizedUserIds)];
        }
      }

      console.log('✅ useDiaryEntries - Utilisateurs autorisés FINAL:', {
        count: authorizedUserIds.length,
        userIds: authorizedUserIds,
        currentUser: effectiveUserId
      });

      // 3. Récupérer les entrées UNIQUEMENT des utilisateurs autorisés
      let query = supabase
        .from('diary_entries')
        .select('*')
        .in('user_id', authorizedUserIds)
        .order('entry_date', { ascending: false });

      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data: diaryData, error } = await query;
      
      if (error) throw error;
      
      if (diaryData && diaryData.length > 0) {
        console.log('📓 useDiaryEntries - Entrées récupérées:', {
          count: diaryData.length,
          entries: diaryData.map(e => ({
            id: e.id,
            title: e.title,
            user_id: e.user_id
          }))
        });

        // Vérifier que toutes les entrées appartiennent bien aux utilisateurs autorisés
        const unauthorizedEntries = diaryData.filter(entry => !authorizedUserIds.includes(entry.user_id));
        if (unauthorizedEntries.length > 0) {
          console.error('🚨 useDiaryEntries - PROBLÈME: Entrées non autorisées détectées:', unauthorizedEntries);
        }

        // Récupérer les profils des auteurs
        const userIds = [...new Set(diaryData.map(entry => entry.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url, created_at')
          .in('id', userIds);

        console.log('👤 useDiaryEntries - Profils récupérés:', profilesData);

        // Combiner les données
        const entriesWithAuthors = diaryData.map(entry => ({
          ...entry,
          profiles: profilesData?.find(profile => profile.id === entry.user_id) || null
        }));

        // Filtrage côté client pour le terme de recherche
        let filteredEntries = entriesWithAuthors;
        if (searchTerm) {
          const lowercaseSearch = searchTerm.toLowerCase();
          filteredEntries = entriesWithAuthors.filter(entry => {
            return (
              entry.title?.toLowerCase().includes(lowercaseSearch) ||
              entry.activities?.toLowerCase().includes(lowercaseSearch) ||
              entry.reflections?.toLowerCase().includes(lowercaseSearch) ||
              entry.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch)) ||
              entry.profiles?.email?.toLowerCase().includes(lowercaseSearch) ||
              entry.profiles?.display_name?.toLowerCase().includes(lowercaseSearch)
            );
          });
        }

        setEntries(filteredEntries);
      } else {
        console.log('📓 useDiaryEntries - Aucune entrée trouvée');
        setEntries([]);
      }
    } catch (error) {
      console.error('💥 useDiaryEntries - Erreur critique:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
