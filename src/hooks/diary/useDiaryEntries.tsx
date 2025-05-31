import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryEntryWithAuthor } from '@/types/diary';

export const useDiaryEntries = (searchTerm: string, startDate: string, endDate: string) => {
  const { session, hasRole, getEffectiveUserId } = useAuth();
  const [entries, setEntries] = useState<DiaryEntryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveUserId = getEffectiveUserId();

  useEffect(() => {
    if (!session) return;
    fetchEntries();
  }, [session, effectiveUserId, searchTerm, startDate, endDate]);

  const fetchEntries = async () => {
    if (!effectiveUserId) return;
    
    try {
      setLoading(true);
      console.log('Diary - Début fetchEntries:', {
        currentUserId: effectiveUserId,
        isAdmin: hasRole('admin'),
        searchTerm: searchTerm,
        searchTermLength: searchTerm?.length || 0,
        startDate,
        endDate
      });
      
      if (hasRole('admin')) {
        // Les admins voient tout
        console.log('Diary - Mode admin: voir toutes les entrées');
        let query = supabase
          .from('diary_entries')
          .select('*')
          .order('entry_date', { ascending: false });

        // Appliquer les filtres pour admin - recherche insensible à la casse sur tous les champs
        if (searchTerm) {
          const searchPattern = `%${searchTerm}%`;
          console.log('Diary - Admin - Construction requête de recherche:', {
            originalSearchTerm: searchTerm,
            searchPattern: searchPattern,
            patternLength: searchPattern.length
          });
          
          const searchQuery = `title.ilike.${searchPattern},activities.ilike.${searchPattern},reflections.ilike.${searchPattern},positive_things.ilike.${searchPattern},negative_things.ilike.${searchPattern},desire_of_day.ilike.${searchPattern},objectives.ilike.${searchPattern},private_notes.ilike.${searchPattern},physical_state.ilike.${searchPattern},mental_state.ilike.${searchPattern},tags::text.ilike.${searchPattern},contacted_people::text.ilike.${searchPattern}`;
          
          console.log('Diary - Admin - Requête de recherche construite:', searchQuery);
          query = query.or(searchQuery);
        }
        if (startDate) {
          query = query.gte('entry_date', startDate);
        }
        if (endDate) {
          query = query.lte('entry_date', endDate);
        }

        console.log('Diary - Requête admin construite, exécution...');
        const { data: diaryData, error } = await query;
        
        if (error) {
          console.error('Diary - Erreur requête admin:', error);
          throw error;
        }
        
        console.log('Diary - Réponse admin:', { 
          count: diaryData?.length || 0, 
          searchTerm: searchTerm,
          hasSearchTerm: !!searchTerm,
          sampleEntries: diaryData?.slice(0, 2).map(entry => ({
            id: entry.id,
            title: entry.title,
            tags: entry.tags,
            reflections: entry.reflections?.substring(0, 100)
          })) || []
        });
        
        if (diaryData && diaryData.length > 0) {
          // Récupérer les profils séparément
          const userIds = [...new Set(diaryData.map(entry => entry.user_id))];
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url, created_at')
            .in('id', userIds);

          if (profilesError) {
            console.error('Diary - Erreur profils admin:', profilesError);
            throw profilesError;
          }

          // Combiner les données
          const entriesWithProfiles = diaryData.map(entry => ({
            ...entry,
            physical_state: ['fatigué', 'dormi', 'énergique'].includes(entry.physical_state) 
              ? entry.physical_state as "fatigué" | "dormi" | "énergique" 
              : null,
            mental_state: ['stressé', 'calme', 'motivé'].includes(entry.mental_state)
              ? entry.mental_state as "stressé" | "calme" | "motivé"
              : null,
            desire_of_day: entry.desire_of_day || '',
            objectives: entry.objectives || '',
            positive_things: entry.positive_things || '',
            negative_things: entry.negative_things || '',
            reflections: entry.reflections || '',
            private_notes: entry.private_notes || '',
            contacted_people: entry.contacted_people || [],
            tags: entry.tags || [],
            profiles: profilesData?.find(profile => profile.id === entry.user_id) || {
              id: entry.user_id,
              email: 'Utilisateur inconnu',
              display_name: null,
              avatar_url: null,
              created_at: new Date().toISOString()
            }
          }));
          
          console.log('Diary - Entrées admin récupérées:', {
            totalCount: entriesWithProfiles.length,
            searchApplied: !!searchTerm,
            searchTerm: searchTerm,
            entriesWithSearchTermInTitle: entriesWithProfiles.filter(e => 
              e.title.toLowerCase().includes(searchTerm?.toLowerCase() || '')
            ).length,
            entriesWithSearchTermInReflections: entriesWithProfiles.filter(e => 
              e.reflections.toLowerCase().includes(searchTerm?.toLowerCase() || '')
            ).length,
            entriesWithSearchTermInTags: entriesWithProfiles.filter(e => 
              JSON.stringify(e.tags).toLowerCase().includes(searchTerm?.toLowerCase() || '')
            ).length
          });
          
          setEntries(entriesWithProfiles);
        } else {
          console.log('Diary - Admin - Aucune entrée trouvée avec les critères de recherche');
          setEntries([]);
        }
        return;
      }

      // Récupération pour l'utilisateur effectif
      console.log('Diary - Récupération des entrées utilisateur effectif:', effectiveUserId);
      
      // 1. Vérifier d'abord s'il y a des entrées dans la table
      console.log('Diary - Vérification globale de la table diary_entries...');
      const { data: allEntriesCheck, error: allEntriesError } = await supabase
        .from('diary_entries')
        .select('id, user_id, title, tags, reflections')
        .limit(10);

      if (allEntriesError) {
        console.error('Diary - Erreur lors de la vérification globale:', allEntriesError);
      } else {
        console.log('Diary - Entrées globales trouvées:', {
          count: allEntriesCheck?.length || 0,
          searchTerm: searchTerm,
          sampleData: allEntriesCheck?.map(entry => ({
            id: entry.id,
            title: entry.title,
            tags: entry.tags,
            reflections: entry.reflections?.substring(0, 50)
          })) || []
        });
      }

      // 2. Récupérer directement les entrées de l'utilisateur effectif
      let userEntriesQuery = supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('entry_date', { ascending: false });

      console.log('Diary - Requête utilisateur effectif construite, filtres:', {
        searchTerm,
        startDate,
        endDate,
        userId: effectiveUserId
      });

      // Appliquer les filtres aux entrées utilisateur - recherche insensible à la casse sur tous les champs
      if (searchTerm) {
        const searchPattern = `%${searchTerm}%`;
        console.log('Diary - User - Construction requête de recherche:', {
          originalSearchTerm: searchTerm,
          searchPattern: searchPattern,
          patternLength: searchPattern.length
        });
        
        const searchQuery = `title.ilike.${searchPattern},activities.ilike.${searchPattern},reflections.ilike.${searchPattern},positive_things.ilike.${searchPattern},negative_things.ilike.${searchPattern},desire_of_day.ilike.${searchPattern},objectives.ilike.${searchPattern},private_notes.ilike.${searchPattern},physical_state.ilike.${searchPattern},mental_state.ilike.${searchPattern},tags::text.ilike.${searchPattern},contacted_people::text.ilike.${searchPattern}`;
        
        console.log('Diary - User - Requête de recherche construite:', searchQuery);
        userEntriesQuery = userEntriesQuery.or(searchQuery);
        console.log('Diary - Filtre de recherche appliqué sur tous les champs (insensible à la casse):', searchTerm);
      }
      if (startDate) {
        userEntriesQuery = userEntriesQuery.gte('entry_date', startDate);
        console.log('Diary - Filtre date début appliqué:', startDate);
      }
      if (endDate) {
        userEntriesQuery = userEntriesQuery.lte('entry_date', endDate);
        console.log('Diary - Filtre date fin appliqué:', endDate);
      }

      console.log('Diary - Exécution requête utilisateur effectif...');
      const { data: userEntries, error: userEntriesError } = await userEntriesQuery;
      
      if (userEntriesError) {
        console.error('Diary - Erreur lors de la récupération des entrées utilisateur:', userEntriesError);
        console.error('Diary - Détails erreur:', {
          message: userEntriesError.message,
          details: userEntriesError.details,
          hint: userEntriesError.hint,
          code: userEntriesError.code
        });
        setEntries([]);
        return;
      }

      console.log('Diary - Réponse entrées utilisateur effectif:', { 
        count: userEntries?.length || 0, 
        searchTerm: searchTerm,
        hasSearchTerm: !!searchTerm,
        sampleEntries: userEntries?.slice(0, 2).map(entry => ({
          id: entry.id,
          title: entry.title,
          tags: entry.tags,
          reflections: entry.reflections?.substring(0, 100)
        })) || []
      });

      // 3. Récupérer les utilisateurs autorisés via les groupes d'invitation
      console.log('Diary - Récupération des groupes pour utilisateur effectif:', effectiveUserId);
      const { data: groupPermissions, error: groupError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          invitation_groups!inner(created_by)
        `)
        .eq('user_id', effectiveUserId);

      if (groupError) {
        console.error('Diary - Erreur groupes:', groupError);
        // En cas d'erreur, au moins retourner les entrées de l'utilisateur
        if (userEntries && userEntries.length > 0) {
          // Récupérer le profil de l'utilisateur
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url, created_at')
            .eq('id', effectiveUserId)
            .single();

          const convertedUserEntries = userEntries.map(entry => ({
            // ... keep existing code (entry mapping logic)
            ...entry,
            physical_state: ['fatigué', 'dormi', 'énergique'].includes(entry.physical_state) 
              ? entry.physical_state as "fatigué" | "dormi" | "énergique" 
              : null,
            mental_state: ['stressé', 'calme', 'motivé'].includes(entry.mental_state)
              ? entry.mental_state as "stressé" | "calme" | "motivé"
              : null,
            desire_of_day: entry.desire_of_day || '',
            objectives: entry.objectives || '',
            positive_things: entry.positive_things || '',
            negative_things: entry.negative_things || '',
            reflections: entry.reflections || '',
            private_notes: entry.private_notes || '',
            contacted_people: entry.contacted_people || [],
            tags: entry.tags || [],
            profiles: userProfile || {
              id: effectiveUserId,
              email: 'Utilisateur inconnu',
              display_name: null,
              avatar_url: null,
              created_at: new Date().toISOString()
            }
          }));
          console.log('Diary - Retour entrées utilisateur seulement après erreur groupes:', convertedUserEntries.length);
          setEntries(convertedUserEntries);
        } else {
          setEntries([]);
        }
        return;
      }

      console.log('Diary - Réponse groupes:', groupPermissions);

      // IDs des utilisateurs autorisés via les groupes d'invitation (créateurs des groupes)
      const groupCreatorIds = groupPermissions?.map(p => p.invitation_groups.created_by).filter(id => id !== effectiveUserId) || [];
      
      console.log('Diary - Utilisateurs autorisés via groupes:', groupCreatorIds);

      let otherEntries: any[] = [];

      // 4. Récupérer les entrées des autres utilisateurs autorisés
      if (groupCreatorIds.length > 0) {
        console.log('Diary - Récupération des autres entrées pour:', groupCreatorIds);
        let otherEntriesQuery = supabase
          .from('diary_entries')
          .select('*')
          .in('user_id', groupCreatorIds)
          .order('entry_date', { ascending: false });

        // Appliquer les filtres aux autres entrées - recherche insensible à la casse sur tous les champs
        if (searchTerm) {
          const searchPattern = `%${searchTerm}%`;
          console.log('Diary - Others - Construction requête de recherche:', {
            originalSearchTerm: searchTerm,
            searchPattern: searchPattern
          });
          
          const searchQuery = `title.ilike.${searchPattern},activities.ilike.${searchPattern},reflections.ilike.${searchPattern},positive_things.ilike.${searchPattern},negative_things.ilike.${searchPattern},desire_of_day.ilike.${searchPattern},objectives.ilike.${searchPattern},private_notes.ilike.${searchPattern},physical_state.ilike.${searchPattern},mental_state.ilike.${searchPattern},tags::text.ilike.${searchPattern},contacted_people::text.ilike.${searchPattern}`;
          
          console.log('Diary - Others - Requête de recherche construite:', searchQuery);
          otherEntriesQuery = otherEntriesQuery.or(searchQuery);
        }
        if (startDate) {
          otherEntriesQuery = otherEntriesQuery.gte('entry_date', startDate);
        }
        if (endDate) {
          otherEntriesQuery = otherEntriesQuery.lte('entry_date', endDate);
        }

        console.log('Diary - Exécution requête autres entrées...');
        const { data: otherEntriesData, error: otherEntriesError } = await otherEntriesQuery;
        
        if (otherEntriesError) {
          console.error('Diary - Erreur lors de la récupération des autres entrées:', otherEntriesError);
          console.error('Diary - Détails erreur autres entrées:', {
            message: otherEntriesError.message,
            details: otherEntriesError.details,
            hint: otherEntriesError.hint,
            code: otherEntriesError.code
          });
        } else {
          otherEntries = otherEntriesData || [];
          console.log('Diary - Réponse autres entrées:', { 
            count: otherEntries.length,
            searchTerm: searchTerm,
            sampleEntries: otherEntries.slice(0, 2).map(entry => ({
              id: entry.id,
              title: entry.title,
              tags: entry.tags,
              reflections: entry.reflections?.substring(0, 100)
            })) || []
          });
        }
      } else {
        console.log('Diary - Aucun autre utilisateur autorisé, pas de requête supplémentaire');
      }

      // Combiner ses entrées avec les entrées autorisées des autres
      const allEntries = [...(userEntries || []), ...otherEntries];
      console.log('Diary - Combinaison des entrées:', {
        userEntriesCount: userEntries?.length || 0,
        otherEntriesCount: otherEntries.length,
        totalCount: allEntries.length,
        searchTerm: searchTerm,
        hasSearchTerm: !!searchTerm
      });
      
      // Trier par date d'entrée (plus récent en premier)
      allEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

      // Récupérer tous les profils nécessaires
      const allUserIds = [...new Set(allEntries.map(entry => entry.user_id))];
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url, created_at')
        .in('id', allUserIds);

      const convertedEntries = allEntries.map(entry => ({
        ...entry,
        physical_state: ['fatigué', 'dormi', 'énergique'].includes(entry.physical_state) 
          ? entry.physical_state as "fatigué" | "dormi" | "énergique" 
          : null,
        mental_state: ['stressé', 'calme', 'motivé'].includes(entry.mental_state)
          ? entry.mental_state as "stressé" | "calme" | "motivé"
          : null,
        desire_of_day: entry.desire_of_day || '',
        objectives: entry.objectives || '',
        positive_things: entry.positive_things || '',
        negative_things: entry.negative_things || '',
        reflections: entry.reflections || '',
        private_notes: entry.private_notes || '',
        contacted_people: entry.contacted_people || [],
        tags: entry.tags || [],
        profiles: allProfiles?.find(profile => profile.id === entry.user_id) || {
          id: entry.user_id,
          email: 'Utilisateur inconnu',
          display_name: null,
          avatar_url: null,
          created_at: new Date().toISOString()
        }
      }));
      
      console.log('Diary - Total entrées finales:', {
        totalCount: convertedEntries.length,
        searchTerm: searchTerm,
        hasSearchTerm: !!searchTerm,
        manualSearchResults: searchTerm ? {
          titleMatches: convertedEntries.filter(e => 
            e.title.toLowerCase().includes(searchTerm.toLowerCase())
          ).length,
          reflectionMatches: convertedEntries.filter(e => 
            e.reflections.toLowerCase().includes(searchTerm.toLowerCase())
          ).length,
          tagMatches: convertedEntries.filter(e => 
            JSON.stringify(e.tags).toLowerCase().includes(searchTerm.toLowerCase())
          ).length
        } : null
      });
      
      setEntries(convertedEntries);
    } catch (error) {
      console.error('Diary - Erreur lors du chargement des entrées:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
