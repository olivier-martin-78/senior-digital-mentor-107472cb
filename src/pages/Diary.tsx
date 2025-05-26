
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

const Diary = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchEntries();
  }, [session, user, navigate, searchTerm, startDate, endDate]);

  const fetchEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

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
      setEntries(data || []);
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
          <h1 className="text-3xl font-serif text-tranches-charcoal">Mon Journal</h1>
          <InviteUserDialog />
        </div>
        
        <DiaryHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
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
          <EmptyDiary hasSearch={!!searchTerm || !!startDate || !!endDate} />
        ) : (
          <EntriesGrid entries={entries} />
        )}
      </div>
    </div>
  );
};

export default Diary;
