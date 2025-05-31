
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
      console.log('🔍 Diary - Début fetchEntries:', {
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

        // Appliquer les filtres pour admin
        if (searchTerm) {
          console.log('Diary - Admin - Recherche avec terme:', searchTerm);
          
          // Recherche dans les champs texte avec ilike (insensible à la casse)
          query = query.or(`title.ilike.%${searchTerm}%,activities.ilike.%${searchTerm}%,reflections.ilike.%${searchTerm}%,positive_things.ilike.%${searchTerm}%,negative_things.ilike.%${searchTerm}%,desire_of_day.ilike.%${searchTerm}%,objectives.ilike.%${searchTerm}%,private_notes.ilike.%${searchTerm}%,physical_state.ilike.%${searchTerm}%,mental_state.ilike.%${searchTerm}%`);
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
          
          // Filtrage côté client pour les arrays si terme de recherche
          let filteredEntries = entriesWithProfiles;
          if (searchTerm) {
            filteredEntries = entriesWithProfiles.filter(entry => {
              const searchLower = searchTerm.toLowerCase();
              
              // Vérifier dans les arrays
              const tagsMatch = entry.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false;
              const peopleMatch = entry.contacted_people?.some(person => person.toLowerCase().includes(searchLower)) || false;
              
              return tagsMatch || peopleMatch;
            });
            
            // Combiner avec les résultats de la requête SQL (éviter les doublons)
            const sqlResultIds = new Set(entriesWithProfiles.map(e => e.id));
            const arrayFilteredIds = new Set(filteredEntries.map(e => e.id));
            
            // Prendre l'union des deux ensembles
            filteredEntries = entriesWithProfiles.filter(entry => 
              sqlResultIds.has(entry.id) || arrayFilteredIds.has(entry.id)
            );
          }
          
          console.log('Diary - Entrées admin récupérées après filtrage arrays:', {
            totalCount: filteredEntries.length,
            searchApplied: !!searchTerm
          });
          
          setEntries(filteredEntries);
        } else {
          console.log('Diary - Admin - Aucune entrée trouvée avec les critères de recherche');
          setEntries([]);
        }
        return;
      }

      // Récupération pour l'utilisateur effectif
      console.log('🔍 Diary - Récupération des entrées utilisateur effectif:', effectiveUserId);
      
      // DIAGNOSTIC: Récupérer TOUTES les entrées de l'utilisateur sans filtre
      console.log('🔍 DIAGNOSTIC - Récupération de TOUTES les entrées pour diagnostic...');
      const { data: allUserEntries, error: allEntriesError } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('entry_date', { ascending: false });

      if (allEntriesError) {
        console.error('🔍 DIAGNOSTIC - Erreur:', allEntriesError);
      } else {
        console.log('🔍 DIAGNOSTIC - TOUTES vos entrées:', {
          count: allUserEntries?.length || 0,
          entries: allUserEntries?.map(entry => ({
            id: entry.id,
            title: entry.title,
            tags: entry.tags,
            contacted_people: entry.contacted_people,
            activities: entry.activities?.substring(0, 50),
            reflections: entry.reflections?.substring(0, 50)
          })) || []
        });
      }
      
      // Récupérer directement les entrées de l'utilisateur effectif avec filtre
      let userEntriesQuery = supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('entry_date', { ascending: false });

      console.log('🔍 Diary - Requête utilisateur effectif construite, filtres:', {
        searchTerm,
        startDate,
        endDate,
        userId: effectiveUserId
      });

      // Appliquer les filtres aux entrées utilisateur
      if (searchTerm) {
        console.log('🔍 Diary - User - Recherche avec terme:', searchTerm);
        console.log('🔍 Diary - Construction de la requête OR avec ilike...');
        
        // Recherche dans les champs texte avec ilike (insensible à la casse)
        const orCondition = `title.ilike.%${searchTerm}%,activities.ilike.%${searchTerm}%,reflections.ilike.%${searchTerm}%,positive_things.ilike.%${searchTerm}%,negative_things.ilike.%${searchTerm}%,desire_of_day.ilike.%${searchTerm}%,objectives.ilike.%${searchTerm}%,private_notes.ilike.%${searchTerm}%,physical_state.ilike.%${searchTerm}%,mental_state.ilike.%${searchTerm}%`;
        
        console.log('🔍 Diary - Condition OR construite:', orCondition);
        userEntriesQuery = userEntriesQuery.or(orCondition);
      }
      if (startDate) {
        userEntriesQuery = userEntriesQuery.gte('entry_date', startDate);
        console.log('Diary - Filtre date début appliqué:', startDate);
      }
      if (endDate) {
        userEntriesQuery = userEntriesQuery.lte('entry_date', endDate);
        console.log('Diary - Filtre date fin appliqué:', endDate);
      }

      console.log('🔍 Diary - Exécution requête utilisateur effectif...');
      const { data: userEntries, error: userEntriesError } = await userEntriesQuery;
      
      if (userEntriesError) {
        console.error('🔍 Diary - Erreur lors de la récupération des entrées utilisateur:', userEntriesError);
        console.error('🔍 Diary - Détails erreur:', {
          message: userEntriesError.message,
          details: userEntriesError.details,
          hint: userEntriesError.hint,
          code: userEntriesError.code
        });
        setEntries([]);
        return;
      }

      console.log('🔍 Diary - Réponse entrées utilisateur effectif (données brutes):', { 
        count: userEntries?.length || 0, 
        searchTerm: searchTerm,
        hasSearchTerm: !!searchTerm,
        rawData: userEntries,
        sampleEntries: userEntries?.slice(0, 2).map(entry => ({
          id: entry.id,
          title: entry.title,
          tags: entry.tags,
          reflections: entry.reflections?.substring(0, 100),
          activities: entry.activities?.substring(0, 100)
        })) || []
      });

      // Récupérer les utilisateurs autorisés via les groupes d'invitation
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
          
          // Filtrage côté client pour les arrays si terme de recherche
          let filteredUserEntries = convertedUserEntries;
          if (searchTerm) {
            console.log('🔍 Diary - Filtrage côté client pour les arrays...');
            const arrayFiltered = convertedUserEntries.filter(entry => {
              const searchLower = searchTerm.toLowerCase();
              
              // Vérifier dans les arrays
              const tagsMatch = entry.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false;
              const peopleMatch = entry.contacted_people?.some(person => person.toLowerCase().includes(searchLower)) || false;
              
              console.log('🔍 Diary - Test entry:', {
                entryId: entry.id,
                title: entry.title,
                tags: entry.tags,
                searchTerm: searchTerm,
                tagsMatch,
                peopleMatch
              });
              
              return tagsMatch || peopleMatch;
            });
            
            console.log('🔍 Diary - Résultats filtrage arrays:', arrayFiltered.length);
            
            // Combiner avec les résultats de la requête SQL (éviter les doublons)
            const sqlResultIds = new Set(convertedUserEntries.map(e => e.id));
            const arrayFilteredIds = new Set(arrayFiltered.map(e => e.id));
            
            // Prendre l'union des deux ensembles
            filteredUserEntries = convertedUserEntries.filter(entry => 
              sqlResultIds.has(entry.id) || arrayFilteredIds.has(entry.id)
            );
            
            console.log('🔍 Diary - Union des résultats SQL et array:', {
              sqlResults: sqlResultIds.size,
              arrayResults: arrayFilteredIds.size,
              finalResults: filteredUserEntries.length
            });
          }
          
          console.log('Diary - Retour entrées utilisateur seulement après erreur groupes:', filteredUserEntries.length);
          setEntries(filteredUserEntries);
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

      // Récupérer les entrées des autres utilisateurs autorisés
      if (groupCreatorIds.length > 0) {
        console.log('Diary - Récupération des autres entrées pour:', groupCreatorIds);
        let otherEntriesQuery = supabase
          .from('diary_entries')
          .select('*')
          .in('user_id', groupCreatorIds)
          .order('entry_date', { ascending: false });

        // Appliquer les filtres aux autres entrées
        if (searchTerm) {
          console.log('Diary - Others - Recherche avec terme:', searchTerm);
          
          // Recherche dans les champs texte avec ilike (insensible à la casse)
          otherEntriesQuery = otherEntriesQuery.or(`title.ilike.%${searchTerm}%,activities.ilike.%${searchTerm}%,reflections.ilike.%${searchTerm}%,positive_things.ilike.%${searchTerm}%,negative_things.ilike.%${searchTerm}%,desire_of_day.ilike.%${searchTerm}%,objectives.ilike.%${searchTerm}%,private_notes.ilike.%${searchTerm}%,physical_state.ilike.%${searchTerm}%,mental_state.ilike.%${searchTerm}%`);
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
      
      // Filtrage côté client pour les arrays si terme de recherche
      let finalEntries = convertedEntries;
      if (searchTerm) {
        console.log('🔍 Diary - Filtrage final côté client pour les arrays...');
        const arrayFiltered = convertedEntries.filter(entry => {
          const searchLower = searchTerm.toLowerCase();
          
          // Vérifier dans les arrays
          const tagsMatch = entry.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false;
          const peopleMatch = entry.contacted_people?.some(person => person.toLowerCase().includes(searchLower)) || false;
          
          console.log('🔍 Diary - Test final entry:', {
            entryId: entry.id,
            title: entry.title,
            tags: entry.tags,
            searchTerm: searchTerm,
            tagsMatch,
            peopleMatch
          });
          
          return tagsMatch || peopleMatch;
        });
        
        console.log('🔍 Diary - Résultats filtrage final arrays:', arrayFiltered.length);
        
        // Combiner avec les résultats de la requête SQL (éviter les doublons)
        const sqlResultIds = new Set(convertedEntries.map(e => e.id));
        const arrayFilteredIds = new Set(arrayFiltered.map(e => e.id));
        
        // Prendre l'union des deux ensembles
        finalEntries = convertedEntries.filter(entry => 
          sqlResultIds.has(entry.id) || arrayFilteredIds.has(entry.id)
        );
        
        console.log('🔍 Diary - Union finale des résultats SQL et array:', {
          sqlResults: sqlResultIds.size,
          arrayResults: arrayFilteredIds.size,
          finalResults: finalEntries.length
        });
      }
      
      console.log('🔍 Diary - Total entrées finales:', {
        totalCount: finalEntries.length,
        searchTerm: searchTerm,
        hasSearchTerm: !!searchTerm,
        finalEntries: finalEntries.map(e => ({
          id: e.id,
          title: e.title,
          tags: e.tags,
          activities: e.activities?.substring(0, 50)
        }))
      });
      
      setEntries(finalEntries);
    } catch (error) {
      console.error('Diary - Erreur lors du chargement des entrées:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
