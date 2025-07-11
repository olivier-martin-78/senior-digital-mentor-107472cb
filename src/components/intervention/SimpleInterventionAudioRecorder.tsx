
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Download } from 'lucide-react';
import { useInterventionAudioRecorder } from '@/hooks/use-intervention-audio-recorder';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { uploadInterventionAudio } from '@/utils/interventionAudioUtils';
import AudioPlayerCore from '@/components/life-story/audio/AudioPlayerCore';

interface SimpleInterventionAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
  existingAudioUrl?: string | null;
  reportId?: string;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const SimpleInterventionAudioRecorder: React.FC<SimpleInterventionAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  existingAudioUrl,
  reportId,
  onRecordingStateChange
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  console.log("🎯 SIMPLE_INTERVENTION - Render:", {
    hasUser: !!user,
    reportId,
    isUploading,
    uploadedAudioUrl: uploadedAudioUrl || existingAudioUrl,
    hasProcessed: hasProcessedRef.current
  });

  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording,
    isSupported
  } = useInterventionAudioRecorder();

  // Utiliser l'URL uploadée, l'URL existante ou l'URL locale
  const currentAudioUrl = uploadedAudioUrl || existingAudioUrl || audioUrl;
  const hasAudio = !!(currentAudioUrl && (audioBlob?.size > 0 || existingAudioUrl));

  // Notifier le parent de l'état d'enregistrement
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isRecording);
    }
  }, [isRecording, onRecordingStateChange]);

  // CRITIQUE: Traitement du blob audio quand il est disponible
  useEffect(() => {
    if (audioBlob && audioBlob.size > 0 && !hasProcessedRef.current) {
      console.log("🎯 SIMPLE_INTERVENTION - Nouveau blob détecté:", audioBlob.size, "octets");
      
      hasProcessedRef.current = true;
      
      // Notifier IMMÉDIATEMENT le parent
      onAudioRecorded(audioBlob);
      
      // Si on a un reportId, uploader vers Supabase
      if (reportId && user?.id) {
        console.log("🎯 SIMPLE_INTERVENTION - Upload vers Supabase");
        handleUpload(audioBlob);
      } else {
        console.log("🎯 SIMPLE_INTERVENTION - Pas d'upload (pas de reportId ou user)");
        // Créer une URL temporaire pour la prévisualisation
        const tempUrl = URL.createObjectURL(audioBlob);
        if (onAudioUrlGenerated) {
          onAudioUrlGenerated(tempUrl);
        }
      }
    }
  }, [audioBlob, reportId, user?.id, onAudioRecorded, onAudioUrlGenerated]);

  // Reset du flag quand on démarre un nouvel enregistrement
  useEffect(() => {
    if (isRecording && hasProcessedRef.current) {
      console.log("🔄 SIMPLE_INTERVENTION - Reset du flag pour nouvel enregistrement");
      hasProcessedRef.current = false;
      setUploadedAudioUrl(null);
    }
  }, [isRecording]);

  const handleUpload = async (blob: Blob) => {
    if (!user?.id || !reportId || isUploading) {
      return;
    }

    try {
      console.log(`🎯 SIMPLE_INTERVENTION - Début upload, taille: ${blob.size} octets`);
      
      await uploadInterventionAudio(
        blob,
        user.id,
        reportId,
        // Callback de succès
        (publicUrl) => {
          console.log(`🎯 SIMPLE_INTERVENTION - ✅ Upload réussi:`, publicUrl);
          setUploadedAudioUrl(publicUrl);
          
          if (onAudioUrlGenerated) {
            onAudioUrlGenerated(publicUrl);
          }
          
          toast({
            title: "Enregistrement sauvegardé",
            description: "Votre enregistrement vocal a été sauvegardé avec succès",
            duration: 2000
          });
        },
        // Callback d'erreur
        (errorMessage) => {
          console.error(`🎯 SIMPLE_INTERVENTION - ❌ Erreur upload:`, errorMessage);
          
          // Fallback : URL temporaire
          const tempUrl = URL.createObjectURL(blob);
          if (onAudioUrlGenerated) {
            onAudioUrlGenerated(tempUrl);
          }
          
          toast({
            title: "Enregistrement temporaire",
            description: "L'enregistrement est sauvé localement. Il sera uploadé lors de la sauvegarde du rapport.",
            variant: "default",
          });
        },
        // Callback de début d'upload
        () => {
          console.log(`🎯 SIMPLE_INTERVENTION - 📤 Début upload`);
          setIsUploading(true);
        },
        // Callback de fin d'upload
        () => {
          console.log(`🎯 SIMPLE_INTERVENTION - 📥 Fin upload`);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error(`🎯 SIMPLE_INTERVENTION - 💥 Erreur non gérée:`, error);
      setIsUploading(false);
    }
  };

  const handleStartRecording = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 SIMPLE_INTERVENTION - Début enregistrement demandé");
    
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un audio",
        variant: "destructive",
      });
      return;
    }
    
    if (!isSupported) {
      toast({
        title: "Erreur",
        description: "L'enregistrement audio n'est pas supporté sur cet appareil",
        variant: "destructive",
      });
      return;
    }
    
    // Reset des états
    setUploadedAudioUrl(null);
    hasProcessedRef.current = false;
    
    try {
      await startRecording();
      console.log("🎯 SIMPLE_INTERVENTION - Enregistrement démarré avec succès");
    } catch (error) {
      console.error("🎯 SIMPLE_INTERVENTION - Erreur démarrage:", error);
      toast({
        title: "Erreur d'enregistrement",
        description: error instanceof Error ? error.message : "Impossible de démarrer l'enregistrement",
        variant: "destructive",
      });
    }
  }, [startRecording, user?.id, isSupported]);

  const handleStopRecording = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 SIMPLE_INTERVENTION - Arrêt enregistrement demandé");
    
    try {
      await stopRecording();
      console.log("🎯 SIMPLE_INTERVENTION - Enregistrement arrêté avec succès");
    } catch (error) {
      console.error("🎯 SIMPLE_INTERVENTION - Erreur arrêt:", error);
    }
  }, [stopRecording]);

  const handleClearRecording = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 SIMPLE_INTERVENTION - Suppression enregistrement");
    
    clearRecording();
    setUploadedAudioUrl(null);
    hasProcessedRef.current = false;
    
    // Notifier le parent avec un blob vide
    const emptyBlob = new Blob([], { type: 'audio/webm' });
    onAudioRecorded(emptyBlob);
    
    if (onAudioUrlGenerated) {
      onAudioUrlGenerated('');
    }
  }, [clearRecording, onAudioRecorded, onAudioUrlGenerated]);

  const handleExportAudio = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentAudioUrl) {
      toast({
        title: "Erreur d'export",
        description: "Aucun enregistrement audio disponible pour l'export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Télécharger le fichier comme blob pour forcer le téléchargement
      const response = await fetch(currentAudioUrl);
      if (!response.ok) {
        throw new Error('Impossible de télécharger le fichier audio');
      }
      
      const blob = await response.blob();
      
      // Créer une URL temporaire pour le blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Créer un élément de téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Générer un nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const fileName = reportId 
        ? `rapport-intervention-${reportId}-${timestamp}.webm`
        : `enregistrement-intervention-${timestamp}.webm`;
      
      link.download = fileName;
      
      // Forcer le téléchargement en ajoutant des attributs spécifiques
      link.style.display = 'none';
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast({
        title: "Export réussi",
        description: "L'enregistrement audio a été téléchargé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'export audio:", error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter l'enregistrement audio",
        variant: "destructive",
      });
    }
  }, [currentAudioUrl, reportId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div className="border rounded-lg p-4 bg-red-50 border-red-200">
        <div className="text-red-700 text-sm">
          ⚠️ L'enregistrement audio n'est pas supporté sur cet appareil
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Enregistrement vocal</h3>
        
        {isRecording && (
          <div className="flex items-center text-red-500">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
            <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {/* États de chargement */}
      {isUploading && (
        <div className="flex items-center justify-center py-2 bg-blue-50 rounded-md">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
          <span className="text-sm text-blue-700">Sauvegarde en cours...</span>
        </div>
      )}

      {/* Contrôles d'enregistrement */}
      <div className="flex items-center gap-2">
        {!isRecording && !hasAudio && (
          <Button
            type="button"
            onClick={handleStartRecording}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Enregistrer
          </Button>
        )}

        {isRecording && (
          <Button
            type="button"
            onClick={handleStopRecording}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Arrêter
          </Button>
        )}

        {hasAudio && !isRecording && (
          <div className="flex items-center gap-2 w-full">
            <Button
              type="button"
              onClick={handleExportAudio}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </Button>
            
            <Button
              type="button"
              onClick={handleClearRecording}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Lecteur audio avec fallback iPad */}
      {currentAudioUrl && hasAudio && !isRecording && (
        <div className="space-y-2">
          <AudioPlayerCore
            audioUrl={currentAudioUrl}
            className="w-full"
          />
        </div>
      )}

      {/* Messages d'état */}
      {(uploadedAudioUrl || existingAudioUrl) && !isUploading && (
        <div className="py-2 bg-green-50 rounded-md text-center">
          <span className="text-sm text-green-700">✓ Audio sauvegardé avec succès</span>
        </div>
      )}
      
      {!reportId && hasAudio && !isUploading && !existingAudioUrl && (
        <div className="py-2 bg-yellow-50 rounded-md text-center">
          <span className="text-sm text-yellow-700">⚠ Audio sera sauvegardé avec le rapport</span>
        </div>
      )}
    </div>
  );
};

export default SimpleInterventionAudioRecorder;
