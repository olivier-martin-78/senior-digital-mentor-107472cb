import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SpotDifferencesGame as SpotDifferencesGameComponent } from '@/components/games/spot-differences/SpotDifferencesGame';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpotDifferencesGameData {
  type: 'spot_differences';
  title: string;
  originalImageUrl: string;
  differencesImageUrl: string;
  differences: string[];
  thumbnailUrl?: string;
}

interface Activity {
  id: string;
  title: string;
  activity_type: string;
  link: string;
  iframe_code: string;
  thumbnail_url?: string;
  shared_globally: boolean;
  sub_activity_tag_id?: string;
  created_by: string;
}

export const SpotDifferencesGamePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState<SpotDifferencesGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGame = async () => {
      if (!id) {
        setError('ID du jeu manquant');
        setLoading(false);
        return;
      }

      try {
        const { data: activity, error: fetchError } = await supabase
          .from('activities')
          .select('*')
          .eq('id', id)
          .eq('activity_type', 'games')
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!activity) {
          throw new Error('Jeu non trouvé');
        }

        if (!activity.iframe_code) {
          throw new Error('Données du jeu manquantes');
        }

        const parsedGameData = JSON.parse(activity.iframe_code) as SpotDifferencesGameData;
        
        if (parsedGameData.type !== 'spot_differences') {
          throw new Error('Type de jeu incorrect');
        }

        setGameData(parsedGameData);
      } catch (err: any) {
        console.error('Erreur lors du chargement du jeu:', err);
        setError(err.message || 'Erreur lors du chargement du jeu');
        toast({
          title: "Erreur",
          description: "Impossible de charger le jeu des 7 erreurs.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id, toast]);

  const handleGoBack = () => {
    navigate('/activities/games');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur</h1>
          <p className="text-muted-foreground mb-4">{error || 'Jeu non trouvé'}</p>
          <Button onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux jeux
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="outline" 
          onClick={handleGoBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux jeux
        </Button>
        
        <SpotDifferencesGameComponent gameData={gameData} />
      </div>
    </div>
  );
};