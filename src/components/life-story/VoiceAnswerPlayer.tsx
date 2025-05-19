
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash, Download, AlertCircle } from 'lucide-react';
import { handleExportAudio, validateAudioUrl, preloadAudio } from './utils/audioUtils';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';

interface VoiceAnswerPlayerProps {
  audioUrl: string;
  onDelete: () => void;
}

export const VoiceAnswerPlayer: React.FC<VoiceAnswerPlayerProps> = ({
  audioUrl,
  onDelete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Vérifier et précharger l'audio
  useEffect(() => {
    let mounted = true;
    
    if (!validateAudioUrl(audioUrl)) {
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    const checkAudio = async () => {
      try {
        const isValid = await preloadAudio(audioUrl);
        if (mounted) {
          setIsLoading(false);
          setHasError(!isValid);
          
          if (!isValid) {
            console.error("Audio non valide après vérification:", audioUrl);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'audio:", error);
        if (mounted) {
          setIsLoading(false);
          setHasError(true);
        }
      }
    };
    
    checkAudio();
    
    return () => {
      mounted = false;
    };
  }, [audioUrl]);
  
  const handleAudioPlay = () => {
    setIsPlaying(true);
  };
  
  const handleAudioPause = () => {
    setIsPlaying(false);
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  const handleAudioError = () => {
    console.error("Erreur de lecture audio:", audioUrl);
    setHasError(true);
    setIsLoading(false);
    
    toast({
      title: "Erreur de lecture",
      description: "Impossible de lire cet enregistrement audio. Il pourrait être corrompu ou inaccessible.",
      variant: "destructive"
    });
  };
  
  const handleDelete = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    onDelete();
  };
  
  const handleExport = () => {
    handleExportAudio(audioUrl);
  };
  
  // Si l'URL n'est pas valide, afficher un message d'erreur
  if (!validateAudioUrl(audioUrl)) {
    return (
      <div className="p-3 bg-red-50 text-red-800 rounded-md flex items-center mb-2">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        <span>URL audio invalide. L'enregistrement pourrait avoir été supprimé.</span>
      </div>
    );
  }
  
  return (
    <div>
      <div className="relative mb-2">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10 rounded-md">
            <Spinner className="h-6 w-6 border-gray-500" />
          </div>
        )}
        
        {hasError ? (
          <div className="p-3 bg-amber-50 text-amber-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>Impossible de charger l'enregistrement audio. Essayez de rafraîchir la page.</span>
          </div>
        ) : (
          <audio 
            ref={audioRef}
            src={audioUrl} 
            controls 
            className={`w-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity rounded-md`}
            onPlay={handleAudioPlay}
            onPause={handleAudioPause}
            onEnded={handleAudioEnded}
            onError={handleAudioError}
          />
        )}
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExport}
          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          disabled={isPlaying || isLoading || hasError}
        >
          <Download className="w-4 h-4 mr-1" /> Exporter l'audio
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          disabled={isPlaying || isLoading}
        >
          <Trash className="w-4 h-4 mr-1" /> Supprimer
        </Button>
      </div>
    </div>
  );
};

export default VoiceAnswerPlayer;
