
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Download } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { toast } from '@/hooks/use-toast';

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
        
        toast({
          title: "Export réussi",
          description: "L'enregistrement audio a été téléchargé sur votre appareil",
        });
      } catch (error) {
        console.error("Erreur lors de l'export audio:", error);
        toast({
          title: "Erreur d'export",
          description: "Impossible d'exporter l'enregistrement audio",
          variant: "destructive",
        });
      }
    }
  };
  
  // Gérer la suppression de l'audio (action explicite de l'utilisateur)
  const handleClearRecording = () => {
    console.log("VoiceRecorder - Suppression explicite de l'enregistrement par l'utilisateur");
    clearRecording();
    setAudioLoaded(false);
    onAudioChange(null);
  };
  
  // Notifier le parent quand l'audio change (sans toast automatique)
  useEffect(() => {
    console.log("VoiceRecorder - État audio changé:", { 
      hasBlob: !!audioBlob, 
      hasUrl: !!audioUrl, 
      blobSize: audioBlob?.size,
      isRecording 
    });
    
    // Seulement notifier le parent si nous avons un blob valide ET que l'enregistrement est terminé
    if (audioBlob && audioBlob.size > 0 && !isRecording) {
      console.log("VoiceRecorder - Envoi du blob au parent:", audioBlob.size, "octets");
      onAudioChange(audioBlob);
    } else if (!audioBlob && !isRecording) {
      // Si pas de blob et enregistrement terminé, notifier la suppression
      console.log("VoiceRecorder - Pas d'audio, notification de suppression");
      onAudioChange(null);
    }
  }, [audioBlob, audioUrl, isRecording, onAudioChange]);
  
  // Gérer le chargement audio
  const handleAudioLoaded = () => {
    console.log("Audio chargé avec succès");
    setAudioLoaded(true);
  };
  
  // Gérer l'erreur audio
  const handleAudioError = () => {
    console.error("Erreur de chargement audio");
    setAudioLoaded(false);
    toast({
      title: "Erreur audio",
      description: "Impossible de lire l'enregistrement audio",
      variant: "destructive",
    });
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
            
            {audioLoaded && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportAudio}
                className="ml-auto"
              >
                <Download className="w-4 h-4 mr-1" /> Exporter l'audio
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
