
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Download, Upload } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { toast } from '@/hooks/use-toast';
import { uploadInterventionAudio } from '@/utils/interventionAudioUtils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderForInterventionProps {
  onAudioChange: (audioBlob: Blob | null) => void;
  reportId?: string;
}

export const VoiceRecorderForIntervention: React.FC<VoiceRecorderForInterventionProps> = ({ 
  onAudioChange,
  reportId 
}) => {
  const { user } = useAuth();
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
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = React.useState<string | null>(null);
  const [existingAudioUrl, setExistingAudioUrl] = React.useState<string | null>(null);
  
  console.log("🎙️ VOICE_RECORDER_INTERVENTION - État:", { 
    isRecording, 
    hasBlob: !!audioBlob, 
    hasUrl: !!audioUrl, 
    blobSize: audioBlob?.size,
    hasNotifiedParent,
    recordingTime,
    reportId,
    isUploading,
    uploadedAudioUrl,
    existingAudioUrl
  });

  // Charger l'audio existant si un reportId est fourni
  useEffect(() => {
    if (reportId && !existingAudioUrl && !audioUrl && !isRecording) {
      console.log("🎙️ VOICE_RECORDER_INTERVENTION - Chargement audio existant pour reportId:", reportId);
      
      const loadExistingAudio = async () => {
        try {
          const { data, error } = await supabase
            .from('intervention_reports')
            .select('audio_url')
            .eq('id', reportId)
            .single();

          if (error) {
            console.error("🎙️ VOICE_RECORDER_INTERVENTION - Erreur chargement audio:", error);
            return;
          }

          if (data?.audio_url && data.audio_url.trim() !== '') {
            console.log("🎙️ VOICE_RECORDER_INTERVENTION - Audio existant trouvé:", data.audio_url);
            setExistingAudioUrl(data.audio_url);
            setUploadedAudioUrl(data.audio_url);
          } else {
            console.log("🎙️ VOICE_RECORDER_INTERVENTION - Aucun audio existant trouvé");
          }
        } catch (error) {
          console.error("🎙️ VOICE_RECORDER_INTERVENTION - Erreur lors du chargement:", error);
        }
      };

      loadExistingAudio();
    }
  }, [reportId, existingAudioUrl, audioUrl, isRecording]);
  
  // Formater le temps d'enregistrement
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Upload automatique de l'audio quand l'enregistrement est terminé
  useEffect(() => {
    if (audioBlob && audioBlob.size > 0 && !isRecording && reportId && user && !isUploading && !uploadedAudioUrl) {
      console.log("🎙️ VOICE_RECORDER_INTERVENTION - Démarrage upload automatique:", {
        blobSize: audioBlob.size,
        reportId,
        userId: user.id
      });
      
      uploadInterventionAudio(
        audioBlob,
        user.id,
        reportId,
        (publicUrl: string) => {
          console.log("🎙️ VOICE_RECORDER_INTERVENTION - Upload réussi:", publicUrl);
          setUploadedAudioUrl(publicUrl);
          setExistingAudioUrl(publicUrl);
          toast({
            title: "Upload réussi",
            description: "L'enregistrement audio a été sauvegardé",
          });
        },
        (error: string) => {
          console.error("🎙️ VOICE_RECORDER_INTERVENTION - Erreur upload:", error);
          toast({
            title: "Erreur d'upload",
            description: error,
            variant: "destructive",
          });
        },
        () => {
          console.log("🎙️ VOICE_RECORDER_INTERVENTION - Début upload");
          setIsUploading(true);
        },
        () => {
          console.log("🎙️ VOICE_RECORDER_INTERVENTION - Fin upload");
          setIsUploading(false);
        }
      );
    }
  }, [audioBlob, isRecording, reportId, user, isUploading, uploadedAudioUrl]);
  
  // Gérer l'export audio
  const handleExportAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const urlToExport = uploadedAudioUrl || existingAudioUrl || audioUrl;
    if (urlToExport) {
      try {
        const downloadLink = document.createElement('a');
        downloadLink.href = urlToExport;
        downloadLink.download = `enregistrement_intervention_${new Date().toISOString().slice(0,10)}.webm`;
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
  const handleClearRecording = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎙️ VOICE_RECORDER_INTERVENTION - Suppression explicite de l'enregistrement par l'utilisateur");
    
    // Supprimer de la base de données si un reportId existe
    if (reportId) {
      try {
        const { error } = await supabase
          .from('intervention_reports')
          .update({ audio_url: null })
          .eq('id', reportId);

        if (error) {
          console.error("🎙️ VOICE_RECORDER_INTERVENTION - Erreur suppression DB:", error);
        } else {
          console.log("🎙️ VOICE_RECORDER_INTERVENTION - Audio supprimé de la DB");
        }
      } catch (error) {
        console.error("🎙️ VOICE_RECORDER_INTERVENTION - Erreur lors de la suppression:", error);
      }
    }
    
    clearRecording();
    setAudioLoaded(false);
    setHasNotifiedParent(false);
    setUploadedAudioUrl(null);
    setExistingAudioUrl(null);
    onAudioChange(null);
  };

  const handleStartRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎙️ VOICE_RECORDER_INTERVENTION - Démarrage enregistrement");
    setHasNotifiedParent(false);
    setUploadedAudioUrl(null);
    setExistingAudioUrl(null);
    startRecording();
  };

  const handleStopRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎙️ VOICE_RECORDER_INTERVENTION - Arrêt enregistrement");
    stopRecording();
  };
  
  // Notifier le parent quand l'audio change
  useEffect(() => {
    console.log("🎙️ VOICE_RECORDER_INTERVENTION - État audio changé:", { 
      hasBlob: !!audioBlob, 
      hasUrl: !!audioUrl, 
      blobSize: audioBlob?.size,
      isRecording,
      hasNotifiedParent
    });
    
    // Seulement notifier si nous avons un blob valide ET que l'enregistrement est terminé ET qu'on n'a pas déjà notifié
    if (audioBlob && audioBlob.size > 0 && !isRecording && !hasNotifiedParent) {
      console.log("🎙️ VOICE_RECORDER_INTERVENTION - Envoi du blob au parent:", audioBlob.size, "octets");
      onAudioChange(audioBlob);
      setHasNotifiedParent(true);
    } else if (!audioBlob && !isRecording && hasNotifiedParent) {
      // Si pas de blob et enregistrement terminé, notifier la suppression
      console.log("🎙️ VOICE_RECORDER_INTERVENTION - Pas d'audio, notification de suppression");
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
  
  // Gérer le chargement audio
  const handleAudioLoaded = () => {
    console.log("🎙️ VOICE_RECORDER_INTERVENTION - Audio chargé avec succès");
    setAudioLoaded(true);
  };
  
  // Gérer l'erreur audio
  const handleAudioError = () => {
    console.error("🎙️ VOICE_RECORDER_INTERVENTION - Erreur de chargement audio");
    setAudioLoaded(false);
    toast({
      title: "Erreur audio",
      description: "Impossible de lire l'enregistrement audio",
      variant: "destructive",
    });
  };

  // Utiliser l'URL uploadée, l'URL existante ou l'URL locale dans l'ordre de priorité
  const currentAudioUrl = uploadedAudioUrl || existingAudioUrl || audioUrl;
  
  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <div className="text-sm font-medium mb-3 text-gray-700">Enregistrement vocal</div>
      
      <div className="flex items-center justify-between mb-4">
        {isRecording ? (
          <>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <span className="text-red-500 font-medium">Enregistrement en cours ({formatTime(recordingTime)})</span>
            </div>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={handleStopRecording}
              className="ml-2"
            >
              <Square className="w-4 h-4 mr-1" /> Arrêter
            </Button>
          </>
        ) : (
          <>
            <span className="text-gray-500">
              {isUploading ? "Upload en cours..." : currentAudioUrl ? "Enregistrement disponible" : "Prêt à enregistrer"}
            </span>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={handleStartRecording}
              disabled={isRecording || isUploading}
            >
              <Mic className="w-4 h-4 mr-1" /> {currentAudioUrl ? "Nouvel enregistrement" : "Enregistrer"}
            </Button>
          </>
        )}
      </div>

      {/* Indicateur d'upload */}
      {isUploading && (
        <div className="flex items-center text-blue-600 text-sm mb-2">
          <Upload className="w-4 h-4 mr-2 animate-spin" />
          Sauvegarde de l'enregistrement...
        </div>
      )}
      
      {currentAudioUrl && !isRecording && (
        <div className="mb-4">
          <audio 
            src={currentAudioUrl} 
            controls 
            className="w-full" 
            onLoadedData={handleAudioLoaded}
            onError={handleAudioError}
          />
          
          <div className="flex mt-2 space-x-2">
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={handleClearRecording}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer
            </Button>
            
            {audioLoaded && (
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={handleExportAudio}
                className="ml-auto"
                disabled={isUploading}
              >
                <Download className="w-4 h-4 mr-1" /> Exporter l'audio
              </Button>
            )}
          </div>
        </div>
      )}

      {!reportId && (
        <div className="text-xs text-orange-600 mt-2">
          ⚠️ Rapport non sauvegardé - l'audio sera uploadé après la création du rapport
        </div>
      )}
    </div>
  );
};

export default VoiceRecorderForIntervention;
