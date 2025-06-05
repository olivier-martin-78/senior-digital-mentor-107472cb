
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
      
      console.log('🔍 useDiaryEntries - DÉBUT - Récupération avec logique de groupe CORRIGÉE');
      
      const effectiveUserId = getEffectiveUserId();
      console.log('👤 useDiaryEntries - Utilisateur courant:', effectiveUserId);

      // 1. Récupérer les groupes où l'utilisateur est membre
      const { data: userGroupMemberships, error: userGroupsError } = await supabase
        .from('group_members')
        .select(`
          group_id, 
          role,
          invitation_groups!inner(
            id,
            name,
            created_by
          )
        `)
        .eq('user_id', effectiveUserId);

      if (userGroupsError) {
        console.error('❌ useDiaryEntries - Erreur récupération groupes utilisateur:', userGroupsError);
        setEntries([]);
        setLoading(false);
        return;
      }

      console.log('👥 useDiaryEntries - Groupes de l\'utilisateur (DÉTAILLÉ):', {
        count: userGroupMemberships?.length || 0,
        groups: userGroupMemberships?.map(g => ({
          group_id: g.group_id,
          role: g.role,
          group_name: g.invitation_groups?.name,
          created_by: g.invitation_groups?.created_by
        }))
      });

      // 2. Construire la liste des utilisateurs autorisés
      let authorizedUserIds = [effectiveUserId]; // Toujours inclure l'utilisateur courant
      console.log('✅ useDiaryEntries - ÉTAPE 1 - Utilisateur courant ajouté:', authorizedUserIds);

      if (userGroupMemberships && userGroupMemberships.length > 0) {
        // Pour chaque groupe, ajouter le créateur du groupe ET tous les membres
        for (const membership of userGroupMemberships) {
          const groupCreator = membership.invitation_groups?.created_by;
          if (groupCreator && !authorizedUserIds.includes(groupCreator)) {
            authorizedUserIds.push(groupCreator);
            console.log('✅ useDiaryEntries - Ajout du créateur du groupe:', groupCreator);
          }
        }

        // Récupérer tous les membres des groupes où l'utilisateur est présent
        const groupIds = userGroupMemberships.map(g => g.group_id);
        const { data: allGroupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);

        if (allGroupMembers) {
          for (const member of allGroupMembers) {
            if (!authorizedUserIds.includes(member.user_id)) {
              authorizedUserIds.push(member.user_id);
            }
          }
        }
        
        console.log('✅ useDiaryEntries - ÉTAPE 2 - Après ajout des membres de groupe:', {
          authorizedUserIds,
          ajoutés: authorizedUserIds.filter(id => id !== effectiveUserId)
        });
      } else {
        console.log('⚠️ useDiaryEntries - Aucun groupe trouvé pour l\'utilisateur');
      }

      console.log('🎯 useDiaryEntries - Utilisateurs autorisés FINAL:', {
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
        console.log('📓 useDiaryEntries - Entrées récupérées (DÉTAILLÉ):', {
          count: diaryData.length,
          entries: diaryData.map(e => ({
            id: e.id,
            title: e.title,
            user_id: e.user_id,
            entry_date: e.entry_date
          }))
        });

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

        console.log('🏁 useDiaryEntries - FIN - Récapitulatif:', {
          authorizedUsers: authorizedUserIds.length,
          entriesFound: diaryData.length,
          filteredEntries: filteredEntries.length
        });

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
