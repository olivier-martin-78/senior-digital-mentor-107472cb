
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import DiaryHeader from '@/components/diary/DiaryHeader';
import EmptyDiary from '@/components/diary/EmptyDiary';
import EntriesGrid from '@/components/diary/EntriesGrid';
import LoadingSpinner from '@/components/diary/LoadingSpinner';
import { DiaryEntry } from '@/types/diary';
import InviteUserDialog from '@/components/InviteUserDialog';
import DateRangeFilter from '@/components/DateRangeFilter';
import UserSelector from '@/components/UserSelector';

const Diary = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchEntries();
  }, [session, user, navigate, searchTerm, startDate, endDate, selectedUserId]);

  const fetchEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Déterminer l'utilisateur cible
      const targetUserId = selectedUserId || user.id;
      
      console.log('Diary - Chargement des entrées:', {
        currentUserId: user.id,
        selectedUserId: selectedUserId,
        targetUserId: targetUserId,
        isAdmin: hasRole('admin')
      });
      
      if (hasRole('admin')) {
        // Les admins voient tout
        console.log('Diary - Mode admin: voir toutes les entrées');
        let query = supabase
          .from('diary_entries')
          .select('*')
          .order('entry_date', { ascending: false });

        if (targetUserId) {
          query = query.eq('user_id', targetUserId);
        }

        // Appliquer les filtres
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,activities.ilike.%${searchTerm}%,reflections.ilike.%${searchTerm}%`);
        }
        if (startDate) {
          query = query.gte('entry_date', startDate);
        }
        if (endDate) {
          query = query.lte('entry_date', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        const convertedEntries = (data || []).map(entry => ({
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
          tags: entry.tags || []
        }));
        
        setEntries(convertedEntries);
        return;
      }

      // Pour les utilisateurs non-admin
      if (selectedUserId && selectedUserId !== user.id) {
        // Vérifier les permissions pour voir le journal de cet utilisateur
        const { data: permissions, error: permError } = await supabase
          .from('diary_permissions')
          .select('diary_owner_id')
          .eq('permitted_user_id', user.id)
          .eq('diary_owner_id', selectedUserId);

        if (permError || !permissions?.length) {
          console.log('Diary - Pas de permissions pour voir ce journal');
          setEntries([]);
          setLoading(false);
          return;
        }
      }

      // Récupérer ses propres entrées ou celles autorisées
      if (selectedUserId && selectedUserId !== user.id) {
        // Entrées d'un autre utilisateur (déjà vérifié les permissions)
        let query = supabase
          .from('diary_entries')
          .select('*')
          .eq('user_id', selectedUserId)
          .order('entry_date', { ascending: false });

        // Appliquer les filtres
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,activities.ilike.%${searchTerm}%,reflections.ilike.%${searchTerm}%`);
        }
        if (startDate) {
          query = query.gte('entry_date', startDate);
        }
        if (endDate) {
          query = query.lte('entry_date', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        const convertedEntries = (data || []).map(entry => ({
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
          tags: entry.tags || []
        }));
        
        setEntries(convertedEntries);
      } else {
        // NOUVELLE LOGIQUE : Ses propres entrées + celles des utilisateurs dont il fait partie du groupe d'invitation
        console.log('Diary - Récupération des entrées avec permissions groupes');
        
        // 1. Ses propres entrées
        let userEntriesQuery = supabase
          .from('diary_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('entry_date', { ascending: false });

        // Appliquer les filtres
        if (searchTerm) {
          userEntriesQuery = userEntriesQuery.or(`title.ilike.%${searchTerm}%,activities.ilike.%${searchTerm}%,reflections.ilike.%${searchTerm}%`);
        }
        if (startDate) {
          userEntriesQuery = userEntriesQuery.gte('entry_date', startDate);
        }
        if (endDate) {
          userEntriesQuery = userEntriesQuery.lte('entry_date', endDate);
        }

        const { data: userEntries, error: userEntriesError } = await userEntriesQuery;
        
        if (userEntriesError) {
          console.error('Diary - Erreur lors de la récupération des entrées utilisateur:', userEntriesError);
          setEntries([]);
          return;
        }

        // 2. Récupérer les permissions via diary_permissions ET groupes d'invitation
        const [diaryPermissionsResult, groupPermissionsResult] = await Promise.all([
          supabase
            .from('diary_permissions')
            .select('diary_owner_id')
            .eq('permitted_user_id', user.id),
          // Récupérer les créateurs de groupes dont l'utilisateur est membre
          supabase
            .from('group_members')
            .select(`
              group_id,
              invitation_groups!inner(created_by)
            `)
            .eq('user_id', user.id)
        ]);

        const diaryPermissions = diaryPermissionsResult.data || [];
        const groupPermissions = groupPermissionsResult.data || [];

        // IDs des utilisateurs autorisés via diary_permissions
        const diaryUserIds = diaryPermissions.map(p => p.diary_owner_id).filter(id => id !== user.id);
        
        // IDs des utilisateurs autorisés via les groupes d'invitation (créateurs des groupes)
        const groupCreatorIds = groupPermissions.map(p => p.invitation_groups.created_by).filter(id => id !== user.id);
        
        // Combiner tous les utilisateurs autorisés
        const authorizedUserIds = [...new Set([...diaryUserIds, ...groupCreatorIds])];

        console.log('Diary - Utilisateurs autorisés via diary_permissions:', diaryUserIds);
        console.log('Diary - Utilisateurs autorisés via groupes:', groupCreatorIds);
        console.log('Diary - Total utilisateurs autorisés:', authorizedUserIds);

        let otherEntries: DiaryEntry[] = [];

        // 3. Récupérer les entrées des autres utilisateurs autorisés
        if (authorizedUserIds.length > 0) {
          let otherEntriesQuery = supabase
            .from('diary_entries')
            .select('*')
            .in('user_id', authorizedUserIds)
            .order('entry_date', { ascending: false });

          // Appliquer les filtres
          if (searchTerm) {
            otherEntriesQuery = otherEntriesQuery.or(`title.ilike.%${searchTerm}%,activities.ilike.%${searchTerm}%,reflections.ilike.%${searchTerm}%`);
          }
          if (startDate) {
            otherEntriesQuery = otherEntriesQuery.gte('entry_date', startDate);
          }
          if (endDate) {
            otherEntriesQuery = otherEntriesQuery.lte('entry_date', endDate);
          }

          const { data: otherEntriesData, error: otherEntriesError } = await otherEntriesQuery;
          
          if (otherEntriesError) {
            console.error('Diary - Erreur lors de la récupération des autres entrées:', otherEntriesError);
          } else {
            otherEntries = otherEntriesData || [];
            console.log('Diary - Autres entrées autorisées récupérées:', otherEntries.length);
          }
        }

        // Combiner ses entrées avec les entrées autorisées des autres
        const allEntries = [...(userEntries || []), ...otherEntries];
        
        // Trier par date d'entrée (plus récent en premier)
        allEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
        
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
          tags: entry.tags || []
        }));
        
        console.log('Diary - Total entrées finales:', convertedEntries.length);
        setEntries(convertedEntries);
      }
    } catch (error) {
      console.error('Diary - Erreur lors du chargement des entrées:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleUserChange = (userId: string | null) => {
    console.log('Diary - Changement d\'utilisateur sélectionné vers:', userId);
    setSelectedUserId(userId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">
            {selectedUserId && selectedUserId !== user?.id ? 'Journal utilisateur' : 'Mon Journal'}
          </h1>
          <InviteUserDialog />
        </div>

        <UserSelector
          permissionType="diary"
          selectedUserId={selectedUserId}
          onUserChange={handleUserChange}
          className="mb-6"
        />
        
        <DiaryHeader 
          entriesCount={entries.length}
        />
        
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={handleClearFilters}
        />
        
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune entrée trouvée pour cette période.</p>
          </div>
        ) : (
          <EntriesGrid entries={entries} />
        )}
      </div>
    </div>
  );
};

export default Diary;
