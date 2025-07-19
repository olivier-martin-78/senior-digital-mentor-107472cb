
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
      // Simuler l'extraction audio (en attendant l'API réelle)
      // Pour l'instant, nous créons un fichier audio de démonstration
      const audioFileName = `audio_${videoId}_${Date.now()}.mp3`;
      
      // Créer un blob audio de démonstration (silence de 30 secondes)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = 44100;
      const duration = 30; // 30 secondes
      const arrayBuffer = audioContext.createBuffer(2, sampleRate * duration, sampleRate);
      
      // Créer un fichier audio vide pour la démonstration
      const audioBlob = new Blob([new ArrayBuffer(1000)], { type: 'audio/mpeg' });
      
      const { error: uploadError } = await supabase.storage
        .from('activity-thumbnails')
        .upload(`audio/${audioFileName}`, audioBlob, {
          contentType: 'audio/mpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('activity-thumbnails')
        .getPublicUrl(`audio/${audioFileName}`);

      onAudioExtracted(publicUrl);

      toast({
        title: 'Succès',
        description: 'Audio extrait avec succès ! (Version de démonstration)',
      });
    } catch (error) {
      console.error('Erreur lors de l\'extraction audio:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'extraire l\'audio. Veuillez uploader un fichier audio manuellement.',
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
