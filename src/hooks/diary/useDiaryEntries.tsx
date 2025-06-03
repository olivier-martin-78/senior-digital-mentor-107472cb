
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
      
      console.log('🔍 useDiaryEntries - DÉBUT - Récupération avec logique applicative stricte');
      
      const effectiveUserId = getEffectiveUserId();
      console.log('👤 useDiaryEntries - Utilisateur courant:', effectiveUserId);

      // 1. Récupérer TOUS les groupes où l'utilisateur est membre (correction de la requête)
      const { data: userGroups, error: userGroupsError } = await supabase
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
        count: userGroups?.length || 0,
        groups: userGroups?.map(g => ({
          group_id: g.group_id,
          role: g.role,
          group_name: g.invitation_groups?.name,
          created_by: g.invitation_groups?.created_by
        }))
      });

      const userGroupIds = userGroups?.map(g => g.group_id) || [];
      console.log('🎯 useDiaryEntries - IDs des groupes:', userGroupIds);

      // 2. Construire la liste des utilisateurs autorisés - TOUJOURS commencer par l'utilisateur courant
      let authorizedUserIds = [effectiveUserId];
      console.log('✅ useDiaryEntries - ÉTAPE 1 - Utilisateur courant ajouté:', authorizedUserIds);

      if (userGroupIds.length > 0) {
        // Récupérer TOUS les membres de TOUS les groupes où l'utilisateur est présent
        const { data: groupMembers, error: groupMembersError } = await supabase
          .from('group_members')
          .select(`
            user_id, 
            group_id, 
            role,
            profiles!inner(
              id,
              email,
              display_name
            )
          `)
          .in('group_id', userGroupIds);

        if (groupMembersError) {
          console.error('❌ useDiaryEntries - Erreur récupération membres groupes:', groupMembersError);
        } else {
          console.log('👥 useDiaryEntries - TOUS les membres des groupes (DÉTAILLÉ):', {
            count: groupMembers?.length || 0,
            members: groupMembers?.map(gm => ({
              user_id: gm.user_id,
              group_id: gm.group_id,
              role: gm.role,
              email: gm.profiles?.email,
              display_name: gm.profiles?.display_name
            }))
          });
          
          // Ajouter TOUS les membres trouvés (y compris le current user)
          const allMemberIds = groupMembers?.map(gm => gm.user_id) || [];
          
          // Fusionner avec l'utilisateur courant et supprimer les doublons
          authorizedUserIds = [...new Set([effectiveUserId, ...allMemberIds])];
          
          console.log('✅ useDiaryEntries - ÉTAPE 2 - Après ajout des membres de groupe:', {
            authorizedUserIds,
            ajoutés: allMemberIds.filter(id => id !== effectiveUserId)
          });
        }
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

        // Vérifier que toutes les entrées appartiennent bien aux utilisateurs autorisés
        const unauthorizedEntries = diaryData.filter(entry => !authorizedUserIds.includes(entry.user_id));
        if (unauthorizedEntries.length > 0) {
          console.error('🚨 useDiaryEntries - PROBLÈME SÉCURITÉ: Entrées non autorisées détectées:', unauthorizedEntries);
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
