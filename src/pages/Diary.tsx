
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

  // Utiliser l'ID de l'utilisateur sélectionné ou l'utilisateur actuel
  const targetUserId = selectedUserId || user?.id;

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchEntries();
  }, [session, user, navigate, searchTerm, startDate, endDate, targetUserId]);

  const fetchEntries = async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('diary_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      // Pour les admins, pas de restriction sur user_id si un utilisateur est sélectionné
      if (hasRole('admin')) {
        query = query.eq('user_id', targetUserId);
      } else {
        // Pour les non-admins, vérifier les permissions
        if (selectedUserId && selectedUserId !== user?.id) {
          // Vérifier si l'utilisateur a des permissions pour voir ce journal
          const { data: permissions, error: permError } = await supabase
            .from('diary_permissions')
            .select('diary_owner_id')
            .eq('permitted_user_id', user?.id)
            .eq('diary_owner_id', selectedUserId);

          if (permError || !permissions?.length) {
            console.log('Pas de permissions pour voir ce journal');
            setEntries([]);
            return;
          }
        }
        query = query.eq('user_id', targetUserId);
      }

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
      
      // Convertir les données pour correspondre au type DiaryEntry avec validation stricte
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
      
      console.log('Entrées de journal chargées:', convertedEntries.length, 'pour utilisateur:', targetUserId);
      setEntries(convertedEntries);
    } catch (error) {
      console.error('Erreur lors du chargement des entrées:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleUserChange = (userId: string | null) => {
    console.log('Changement d\'utilisateur sélectionné:', userId);
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
