
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntry } from '@/types/diary';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Plus, Book, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Mon journal intime</h1>
          <Link to="/diary/new">
            <Button className="bg-tranches-sage hover:bg-tranches-sage/90">
              <Plus className="mr-2 h-4 w-4" /> Nouvelle entrée
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center my-10">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
            <Book className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Commencez votre journal</h3>
            <p className="mt-2 text-gray-500">
              Vous n'avez pas encore d'entrées dans votre journal. Créez votre première entrée pour commencer à documenter votre vie quotidienne.
            </p>
            <Link to="/diary/new" className="mt-4 inline-block">
              <Button className="bg-tranches-sage hover:bg-tranches-sage/90">
                <Plus className="mr-2 h-4 w-4" /> Créer ma première entrée
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <Link 
                to={`/diary/${entry.id}`} 
                key={entry.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  {entry.entry_date && format(parseISO(entry.entry_date), "d MMMM yyyy", { locale: fr })}
                </div>
                <h3 className="font-medium text-xl mb-2 text-tranches-charcoal">{entry.title}</h3>
                
                {entry.mood_rating && (
                  <div className="flex items-center mt-4">
                    <div className="text-sm mr-2">Humeur:</div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span 
                          key={i} 
                          className={`w-4 h-4 rounded-full mx-0.5 ${i < entry.mood_rating! ? 'bg-yellow-400' : 'bg-gray-200'}`}
                        ></span>
                      ))}
                    </div>
                  </div>
                )}
                
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {entry.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Diary;
