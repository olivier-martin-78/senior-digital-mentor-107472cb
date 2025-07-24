
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DictationGame from '@/components/games/dictation/DictationGame';

const DictationGamePage = () => {
  const { id } = useParams<{ id: string }>();
  const [dictationData, setDictationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDictationData = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data?.iframe_code) {
          const parsedData = JSON.parse(data.iframe_code);
          console.log('Données activité complètes:', data);
          console.log('Audio URL dans la base:', data.audio_url);
          console.log('Données parsées:', parsedData);
          
          if (parsedData.type === 'dictation') {
            // Utiliser l'URL audio des données parsées, pas de la base de données
            setDictationData({
              ...parsedData,
              audioUrl: parsedData.audioUrl || data.audio_url // Fallback sur data.audio_url si pas dans parsedData
            });
          } else {
            throw new Error('Cette activité n\'est pas une dictée');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la dictée:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la dictée',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDictationData();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la dictée...</p>
        </div>
      </div>
    );
  }

  if (!dictationData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dictée introuvable</h1>
          <p className="text-gray-600 mb-4">Cette dictée n'existe pas ou n'est plus disponible.</p>
          <Link
            to="/activities/games"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux jeux
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/activities/games"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux jeux
          </Link>
        </div>
        
        <DictationGame
          title={dictationData.title}
          dictationText={dictationData.dictationText}
          correctedText={dictationData.correctedText}
          audioUrl={dictationData.audioUrl}
        />
      </div>
    </div>
  );
};

export default DictationGamePage;
