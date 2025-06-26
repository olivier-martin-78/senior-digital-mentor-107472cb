
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Download } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';

interface VoiceRecorderProps {
  onAudioChange: (audioBlob: Blob | null) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onAudioChange 
}) => {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    recordingTime
  } = useVoiceRecorder();
  
  const [audioLoaded, setAudioLoaded] = React.useState(false);
  const [hasNotifiedParent, setHasNotifiedParent] = React.useState(false);
  
  // Formater le temps d'enregistrement
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Gérer l'export audio
  const handleExportAudio = () => {
    if (audioBlob && audioUrl) {
      try {
        const downloadLink = document.createElement('a');
        downloadLink.href = audioUrl;
        downloadLink.download = `enregistrement_vocal_${new Date().toISOString().slice(0,10)}.webm`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Pas de toast ici pour éviter la confusion - l'export est silencieux
      } catch (error) {
        console.error("Erreur lors de l'export audio:", error);
      }
    }
  };
  
  // Gérer la suppression de l'audio (action explicite de l'utilisateur)
  const handleClearRecording = () => {
    console.log("VoiceRecorder - Suppression explicite de l'enregistrement par l'utilisateur");
    clearRecording();
    setAudioLoaded(false);
    setHasNotifiedParent(false);
    onAudioChange(null);
  };
  
  // Notifier le parent quand l'audio change (avec protection contre la boucle)
  useEffect(() => {
    console.log("VoiceRecorder - État audio changé:", { 
      hasBlob: !!audioBlob, 
      hasUrl: !!audioUrl, 
      blobSize: audioBlob?.size,
      isRecording,
      hasNotifiedParent
    });
    
    // Seulement notifier si nous avons un blob valide ET que l'enregistrement est terminé ET qu'on n'a pas déjà notifié
    if (audioBlob && audioBlob.size > 0 && !isRecording && !hasNotifiedParent) {
      console.log("VoiceRecorder - Envoi du blob au parent:", audioBlob.size, "octets");
      onAudioChange(audioBlob);
      setHasNotifiedParent(true);
    } else if (!audioBlob && !isRecording && hasNotifiedParent) {
      // Si pas de blob et enregistrement terminé, notifier la suppression
      console.log("VoiceRecorder - Pas d'audio, notification de suppression");
      onAudioChange(null);
      setHasNotifiedParent(false);
    }
  }, [audioBlob, audioUrl, isRecording, hasNotifiedParent, onAudioChange]);
  
  // Reset du flag quand on démarre un nouvel enregistrement
  useEffect(() => {
    if (isRecording) {
      setHasNotifiedParent(false);
    }
  }, [isRecording]);
  
  // Gérer le chargement audio - ne pas afficher d'erreur sur iPhone
  const handleAudioLoaded = () => {
    console.log("Audio chargé avec succès");
    setAudioLoaded(true);
  };
  
  // Gérer l'erreur audio - silencieux sur les appareils mobiles où l'audio fonctionne malgré l'erreur
  const handleAudioError = (error: any) => {
    console.log("Événement d'erreur audio détecté (peut être normal sur certains appareils):", error);
    // Ne pas afficher de toast d'erreur car l'audio peut fonctionner malgré cet événement
    // Cela évite les faux positifs sur iPhone et autres appareils mobiles
  };
  
  return (
    <div className="border rounded-md p-4 bg-gray-50">
      <div className="text-sm font-medium mb-2">Enregistrement vocal</div>
      
      <div className="flex items-center justify-between mb-4">
        {isRecording ? (
          <>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <span className="text-red-500 font-medium">Enregistrement en cours ({formatTime(recordingTime)})</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={stopRecording}
              className="ml-2"
            >
              <Square className="w-4 h-4 mr-1" /> Arrêter
            </Button>
          </>
        ) : (
          <>
            <span className="text-gray-500">Prêt à enregistrer</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startRecording}
              disabled={isRecording}
            >
              <Mic className="w-4 h-4 mr-1" /> Enregistrer
            </Button>
          </>
        )}
      </div>
      
      {audioUrl && !isRecording && (
        <div className="mb-4">
          <audio 
            src={audioUrl} 
            controls 
            className="w-full" 
            onLoadedData={handleAudioLoaded}
            onError={handleAudioError}
          />
          
          <div className="flex mt-2 space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearRecording}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportAudio}
              className="ml-auto"
            >
              <Download className="w-4 h-4 mr-1" /> Exporter l'audio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
