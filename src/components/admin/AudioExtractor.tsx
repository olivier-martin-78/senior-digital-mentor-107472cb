
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Music, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ManualAudioUploader } from './ManualAudioUploader';

interface AudioExtractorProps {
  youtubeUrl: string;
  onAudioExtracted: (audioUrl: string) => void;
}

const AudioExtractor = ({ youtubeUrl, onAudioExtracted }: AudioExtractorProps) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [showManualUpload, setShowManualUpload] = useState(false);
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

    console.log('🎵 Starting audio extraction for video:', videoId);
    setIsExtracting(true);
    setExtractionStatus('idle');
    setLastError(null);

    try {
      // Appeler l'Edge Function pour extraire l'audio
      console.log('📡 Calling extract-youtube-audio function...');
      const { data, error } = await supabase.functions.invoke('extract-youtube-audio', {
        body: { youtubeUrl }
      });

      console.log('📋 Function response:', { data, error });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Erreur lors de l\'appel à la fonction d\'extraction');
      }

      if (!data) {
        throw new Error('Aucune réponse de la fonction d\'extraction');
      }

      if (!data.success || !data.audioUrl) {
        const errorMsg = data.details || data.error || 'Impossible d\'extraire l\'audio de cette vidéo';
        throw new Error(errorMsg);
      }

      console.log('✅ Audio extraction successful:', {
        audioUrl: data.audioUrl,
        fileName: data.fileName,
        fileSize: data.fileSize
      });

      onAudioExtracted(data.audioUrl);
      setExtractionStatus('success');

      toast({
        title: 'Succès',
        description: `Audio extrait avec succès depuis YouTube ! (${Math.round((data.fileSize || 0) / 1024)} KB)`,
      });

    } catch (error) {
      console.error('💥 Audio extraction error:', error);
      
      const errorMessage = 'Les services d\'extraction automatique sont temporairement indisponibles. Utilisez l\'upload manuel ci-dessous.';
      setLastError(errorMessage);
      setExtractionStatus('error');
      setShowManualUpload(true);
      
      toast({
        title: 'Extraction automatique indisponible',
        description: 'Utilisez l\'upload manuel pour ajouter votre fichier audio',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const getStatusIcon = () => {
    switch (extractionStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Music className="h-4 w-4" />;
    }
  };

  const getButtonVariant = () => {
    switch (extractionStatus) {
      case 'success':
        return 'default' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={extractAudio}
        disabled={isExtracting || !youtubeUrl}
        variant={getButtonVariant()}
        className="w-full"
      >
        {isExtracting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Extraction en cours...
          </>
        ) : (
          <>
            {getStatusIcon()}
            <span className="ml-2">
              {extractionStatus === 'success' 
                ? 'Audio extrait avec succès !' 
                : extractionStatus === 'error'
                ? 'Réessayer l\'extraction'
                : 'Extraire audio depuis YouTube'
              }
            </span>
          </>
        )}
      </Button>

      {extractionStatus === 'error' && lastError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Détails de l'erreur :</strong> {lastError}
          </AlertDescription>
        </Alert>
      )}

      {extractionStatus === 'success' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-sm text-green-700">
            L'audio a été extrait et téléversé avec succès. Vous pouvez maintenant sauvegarder votre quiz musical.
          </AlertDescription>
        </Alert>
      )}

      {isExtracting && (
        <div className="text-xs text-gray-500 text-center">
          Cela peut prendre quelques secondes selon la taille de la vidéo...
        </div>
      )}

      {showManualUpload && (
        <div className="mt-4">
          <ManualAudioUploader 
            youtubeUrl={youtubeUrl}
            onAudioExtracted={(audioUrl) => {
              onAudioExtracted(audioUrl);
              setShowManualUpload(false);
              setExtractionStatus('success');
              setLastError(null);
              toast({
                title: 'Succès',
                description: 'Fichier audio uploadé avec succès !',
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AudioExtractor;
