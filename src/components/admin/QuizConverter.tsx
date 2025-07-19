
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Music, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface QuizConverterProps {
  onConversionComplete: () => void;
}

const QuizConverter = ({ onConversionComplete }: QuizConverterProps) => {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResults, setConversionResults] = useState<{success: number, failed: number} | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const convertExistingQuizzes = async () => {
    if (!user) return;

    setIsConverting(true);
    setConversionResults(null);

    try {
      // Récupérer tous les quiz musicaux existants sans audio
      const { data: quizzes, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('activity_type', 'games')
        .is('audio_url', null)
        .not('iframe_code', 'is', null);

      if (fetchError) throw fetchError;

      let successCount = 0;
      let failedCount = 0;

      for (const quiz of quizzes || []) {
        try {
          const gameData = JSON.parse(quiz.iframe_code || '{}');
          
          if (gameData.type === 'music_quiz' && gameData.questions) {
            let quizUpdated = false;
            
            // Pour chaque question, essayer d'extraire l'audio
            for (const question of gameData.questions) {
              if (question.youtubeEmbed && !question.audioUrl) {
                // Simulation d'extraction audio (en attente d'API réelle)
                const videoId = extractYouTubeId(question.youtubeEmbed);
                if (videoId) {
                  // Créer un fichier audio de démonstration
                  const audioFileName = `converted_audio_${videoId}_${Date.now()}.mp3`;
                  const audioBlob = new Blob([new ArrayBuffer(1000)], { type: 'audio/mpeg' });
                  
                  const { error: uploadError } = await supabase.storage
                    .from('activity-thumbnails')
                    .upload(`audio/${audioFileName}`, audioBlob);

                  if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                      .from('activity-thumbnails')
                      .getPublicUrl(`audio/${audioFileName}`);
                    
                    question.audioUrl = publicUrl;
                    quizUpdated = true;
                  }
                }
              }
            }
            
            if (quizUpdated) {
              // Mettre à jour le quiz avec les nouvelles URLs audio
              const { error: updateError } = await supabase
                .from('activities')
                .update({
                  iframe_code: JSON.stringify(gameData),
                  audio_url: gameData.questions.find((q: any) => q.audioUrl)?.audioUrl
                })
                .eq('id', quiz.id);

              if (updateError) {
                failedCount++;
              } else {
                successCount++;
              }
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la conversion du quiz ${quiz.id}:`, error);
          failedCount++;
        }
      }

      setConversionResults({ success: successCount, failed: failedCount });
      
      toast({
        title: 'Conversion terminée',
        description: `${successCount} quiz convertis avec succès, ${failedCount} échecs`,
      });

      if (successCount > 0) {
        onConversionComplete();
      }
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de convertir les quiz existants',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const extractYouTubeId = (embedCode: string): string | null => {
    const match = embedCode.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Convertir les Quiz Existants
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Cet outil convertit automatiquement les quiz musicaux existants en ajoutant des fichiers audio 
          pour les rendre compatibles avec iOS/iPad.
        </p>
        
        {conversionResults && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">Résultats de la conversion :</span>
            </div>
            <p className="text-sm">
              ✅ {conversionResults.success} quiz convertis avec succès<br />
              {conversionResults.failed > 0 && (
                <>❌ {conversionResults.failed} échecs</>
              )}
            </p>
          </div>
        )}
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Note :</p>
              <p className="text-yellow-700">
                Cette version utilise des fichiers audio de démonstration. 
                Dans la version finale, l'audio sera extrait réellement depuis YouTube.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={convertExistingQuizzes}
          disabled={isConverting}
          className="w-full"
        >
          {isConverting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Conversion en cours...
            </>
          ) : (
            <>
              <Music className="h-4 w-4 mr-2" />
              Convertir tous les quiz existants
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizConverter;
