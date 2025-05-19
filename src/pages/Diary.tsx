
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntry } from '@/types/diary';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import DiaryPageHeader from '@/components/diary/DiaryPageHeader';
import EntriesGrid from '@/components/diary/EntriesGrid';
import LoadingSpinner from '@/components/diary/LoadingSpinner';

const Diary = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('diary_entries')
          .select('*')
          .order('entry_date', { ascending: false })
          .limit(10);

        if (error) {
          throw error;
        }

        if (data) {
          setEntries(data as DiaryEntry[]);
        }
      } catch (error: any) {
        console.error('Erreur lors de la récupération des entrées:', error);
        toast({
          title: 'Erreur',
          description: "Impossible de récupérer vos entrées de journal.",
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user, toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <DiaryPageHeader title="Mon journal intime" />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <EntriesGrid entries={entries} />
        )}
      </div>
    </div>
  );
};

export default Diary;
