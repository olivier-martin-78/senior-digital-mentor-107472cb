
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Download } from 'lucide-react';
import { useAdaptiveVoiceRecorder } from '@/hooks/use-adaptive-voice-recorder';
import { toast } from '@/hooks/use-toast';

interface AdaptiveVoiceRecorderProps {
  onAudioChange: (audioBlob: Blob | null) => void;
}

export const AdaptiveVoiceRecorder: React.FC<AdaptiveVoiceRecorderProps> = ({ 
  onAudioChange 
}) => {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    recordingTime,
    recordingFormat
  } = useAdaptiveVoiceRecorder();
  
  const [audioLoaded, setAudioLoaded] = React.useState(false);
  const hasNotifiedRef = useRef(false);
  const lastBlobRef = useRef<Blob | null>(null);
  
  console.log('AdaptiveVoiceRecorder - État actuel:', { 
    isRecording, 
    hasBlob: !!audioBlob, 
    hasUrl: !!audioUrl,
    blobSize: audioBlob?.size,
    recordingFormat,
    hasNotified: hasNotifiedRef.current
  });
  
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
        downloadLink.download = `enregistrement_vocal_${new Date().toISOString().slice(0,10)}.${recordingFormat}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        toast({
          title: "Export réussi",
          description: `L'enregistrement audio (${recordingFormat.toUpperCase()}) a été téléchargé sur votre appareil`,
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
  
  // Gérer la suppression de l'audio
  const handleClearRecording = () => {
    console.log("AdaptiveVoiceRecorder - Suppression explicite de l'enregistrement");
    clearRecording();
    setAudioLoaded(false);
    hasNotifiedRef.current = false;
    lastBlobRef.current = null;
    onAudioChange(null);
  };
  
  // Notifier le parent seulement quand nécessaire
  useEffect(() => {
    if (isRecording) {
      return;
    }
    
    if (audioBlob && audioBlob !== lastBlobRef.current && !hasNotifiedRef.current) {
      console.log("AdaptiveVoiceRecorder - Nouveau blob détecté, notification au parent:", {
        size: audioBlob.size,
        type: audioBlob.type,
        format: recordingFormat
      });
      lastBlobRef.current = audioBlob;
      hasNotifiedRef.current = true;
      onAudioChange(audioBlob);
    } else if (!audioBlob && hasNotifiedRef.current) {
      console.log("AdaptiveVoiceRecorder - Blob supprimé, notification au parent");
      lastBlobRef.current = null;
      hasNotifiedRef.current = false;
      onAudioChange(null);
    }
  }, [audioBlob, isRecording, recordingFormat, onAudioChange]);
  
  // Reset du flag quand on démarre un nouvel enregistrement
  useEffect(() => {
    if (isRecording) {
      hasNotifiedRef.current = false;
    }
  }, [isRecording]);
  
  // Gérer le chargement audio
  const handleAudioLoaded = () => {
    console.log("Audio chargé avec succès");
    setAudioLoaded(true);
  };
  
  const handleAudioError = (error: any) => {
    console.log("Événement d'erreur audio détecté:", error);
  };
  
  return (
    <div className="border rounded-md p-4 bg-gray-50">
      <div className="text-sm font-medium mb-2">
        Enregistrement vocal adaptatif
        {recordingFormat && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            Format: {recordingFormat.toUpperCase()}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between mb-4">
        {isRecording ? (
          <>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <span className="text-red-500 font-medium">
                Enregistrement en cours ({formatTime(recordingTime)})
              </span>
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
              <Download className="w-4 h-4 mr-1" /> Exporter ({recordingFormat.toUpperCase()})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveVoiceRecorder;
