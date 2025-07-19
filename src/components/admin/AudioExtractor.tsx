
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Music } from 'lucide-react';

interface AudioExtractorProps {
  youtubeUrl: string;
  onAudioExtracted: (audioUrl: string) => void;
}

const AudioExtractor = ({ youtubeUrl, onAudioExtracted }: AudioExtractorProps) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const extractAudio = async () => {
    if (!user || !youtubeUrl) return;

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      toast({
        title: 'Erreur',
        description: 'URL YouTube invalide',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);

    try {
      // Appeler l'Edge Function pour extraire l'audio
      const { data, error } = await supabase.functions.invoke('extract-youtube-audio', {
        body: { youtubeUrl }
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de l\'extraction audio');
      }

      if (!data.success || !data.audioUrl) {
        throw new Error('Impossible d\'extraire l\'audio de cette vidéo');
      }

      onAudioExtracted(data.audioUrl);

      toast({
        title: 'Succès',
        description: 'Audio extrait avec succès depuis YouTube !',
      });
    } catch (error) {
      console.error('Erreur lors de l\'extraction audio:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible d\'extraire l\'audio. Veuillez uploader un fichier audio manuellement.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={extractAudio}
      disabled={isExtracting || !youtubeUrl}
      variant="outline"
      className="w-full"
    >
      {isExtracting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Extraction en cours...
        </>
      ) : (
        <>
          <Music className="h-4 w-4 mr-2" />
          Extraire audio depuis YouTube
        </>
      )}
    </Button>
  );
};

export default AudioExtractor;
