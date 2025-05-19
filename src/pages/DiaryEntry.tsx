
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntry } from '@/types/diary';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import DiaryHeader from '@/components/diary/DiaryHeader';
import EntryHeader from '@/components/diary/EntryHeader';
import EntryContent from '@/components/diary/EntryContent';

const DiaryEntryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setEntry(data as DiaryEntry);
        }
      } catch (error: any) {
        console.error('Erreur lors de la récupération de l\'entrée:', error);
        toast({
          title: 'Erreur',
          description: "Impossible de récupérer cette entrée de journal.",
          variant: 'destructive',
        });
        navigate('/diary');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id, user, toast, navigate]);

  const handleDelete = async () => {
    if (!id || !user) return;

    try {
      // Delete media if exists
      if (entry?.media_url) {
        const mediaPath = entry.media_url.split('/').pop();
        if (mediaPath) {
          await supabase.storage
            .from('diary_media')
            .remove([`${user.id}/${mediaPath}`]);
        }
      }

      // Delete entry
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Succès',
        description: "L'entrée a été supprimée avec succès.",
      });

      navigate('/diary');
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'entrée:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer cette entrée de journal.",
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-serif text-tranches-charcoal">Entrée non trouvée</h2>
            <button 
              className="mt-4 bg-tranches-sage text-white px-4 py-2 rounded hover:bg-tranches-sage/90"
              onClick={() => navigate('/diary')}
            >
              Retour au journal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <DiaryHeader entryId={entry.id} onDelete={handleDelete} />
          
          <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <EntryHeader 
              title={entry.title} 
              date={entry.entry_date} 
              moodRating={entry.mood_rating} 
            />
            
            <EntryContent entry={entry} />
          </article>
        </div>
      </div>
    </div>
  );
};

export default DiaryEntryPage;
