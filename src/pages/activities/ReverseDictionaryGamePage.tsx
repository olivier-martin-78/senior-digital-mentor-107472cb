import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReverseDictionaryGame from '@/components/games/reverseDictionary/ReverseDictionaryGame';
import { ReverseDictionaryData } from '@/types/reverseDictionary';

const ReverseDictionaryGamePage = () => {
  const { id } = useParams<{ id: string }>();
  const [gameData, setGameData] = useState<ReverseDictionaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGameData = async () => {
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
          
          if (parsedData.type === 'reverse_dictionary') {
            setGameData(parsedData);
          } else {
            throw new Error('Cette activité n\'est pas un dictionnaire inversé');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du dictionnaire inversé:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le dictionnaire inversé',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dictionnaire inversé...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dictionnaire inversé introuvable</h1>
          <p className="text-gray-600 mb-4">Ce jeu n'existe pas ou n'est plus disponible.</p>
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
        
        <ReverseDictionaryGame
          title={gameData.title}
          timerDuration={gameData.timerDuration}
          words={gameData.words}
        />
      </div>
    </div>
  );
};

export default ReverseDictionaryGamePage;