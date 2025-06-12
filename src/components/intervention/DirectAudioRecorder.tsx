
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadInterventionAudio } from '@/utils/interventionAudioUtils';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import VoiceRecorderForIntervention from './VoiceRecorderForIntervention';

interface DirectAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
  onRecordingStatusChange?: (isRecording: boolean) => void;
  reportId?: string;
}

const DirectAudioRecorder: React.FC<DirectAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  onRecordingStatusChange,
  reportId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [hasProcessedCurrentBlob, setHasProcessedCurrentBlob] = useState(false);
  const { user } = useAuth();

  // Refs stables pour éviter les re-créations
  const stableCallbacksRef = useRef({
    onAudioRecorded,
    onAudioUrlGenerated,
    onRecordingStatusChange
  });

  // Mettre à jour les refs sans déclencher de re-render
  useEffect(() => {
    stableCallbacksRef.current = {
      onAudioRecorded,
      onAudioUrlGenerated,
      onRecordingStatusChange
    };
  });

  console.log("🔧 DIRECT - DirectAudioRecorder rendu SIMPLIFIÉ", {
    hasUser: !!user,
    userId: user?.id,
    reportId,
    isUploading,
    uploadedAudioUrl,
    hasProcessedCurrentBlob
  });

  // Callback stable pour traiter l'audio
  const stableHandleAudio = useCallback((blob: Blob | null) => {
    console.log('🎙️ DIRECT - Traitement audio stable SIMPLIFIÉ:', { 
      hasBlob: !!blob, 
      blobSize: blob?.size 
    });
    
    if (!blob || blob.size === 0) {
      console.log('🎙️ DIRECT - Audio supprimé ou vide SIMPLIFIÉ');
      setUploadedAudioUrl(null);
      setHasProcessedCurrentBlob(false);
      
      // Notifier le parent avec un blob vide
      if (stableCallbacksRef.current.onAudioRecorded) {
        const emptyBlob = new Blob([], { type: 'audio/webm' });
        stableCallbacksRef.current.onAudioRecorded(emptyBlob);
      }
      
      if (stableCallbacksRef.current.onAudioUrlGenerated) {
        stableCallbacksRef.current.onAudioUrlGenerated('');
      }
      return;
    }

    // Marquer comme traité pour éviter les doublons
    if (hasProcessedCurrentBlob) {
      console.log('🎙️ DIRECT - Blob déjà traité, ignoré SIMPLIFIÉ');
      return;
    }
    setHasProcessedCurrentBlob(true);
    
    // Notifier immédiatement le parent avec le blob
    if (stableCallbacksRef.current.onAudioRecorded) {
      stableCallbacksRef.current.onAudioRecorded(blob);
    }

    // Si on a un reportId et un utilisateur, faire l'upload
    if (reportId && user?.id) {
      console.log("🎙️ DIRECT - Conditions remplies pour upload SIMPLIFIÉ");
      handleUpload(blob);
    } else {
      console.log("🎙️ DIRECT - Upload différé SIMPLIFIÉ:", { hasReportId: !!reportId, hasUser: !!user?.id });
    }
  }, [hasProcessedCurrentBlob, user?.id, reportId]);

  const handleUpload = async (blob: Blob) => {
    if (!user?.id || !reportId || isUploading) {
      console.log("🎙️ DIRECT - Upload annulé SIMPLIFIÉ:", { 
        hasUser: !!user?.id, 
        hasReportId: !!reportId,
        isUploading 
      });
      return;
    }

    console.log(`🎙️ DIRECT - === DÉBUT UPLOAD SIMPLIFIÉ ===`);
    console.log(`🎙️ DIRECT - Taille blob: ${blob.size} octets`);
    console.log(`🎙️ DIRECT - User ID: ${user.id}`);
    console.log(`🎙️ DIRECT - Report ID: ${reportId}`);
    
    try {
      await uploadInterventionAudio(
        blob,
        user.id,
        reportId,
        // Callback succès
        (publicUrl) => {
          console.log(`🎙️ DIRECT - ✅ Upload réussi SIMPLIFIÉ:`, publicUrl);
          setUploadedAudioUrl(publicUrl);
          
          if (stableCallbacksRef.current.onAudioUrlGenerated) {
            stableCallbacksRef.current.onAudioUrlGenerated(publicUrl);
          }
          
          toast({
            title: "Enregistrement sauvegardé",
            description: "L'audio a été sauvegardé avec succès",
            duration: 2000
          });
        },
        // Callback erreur
        (errorMessage) => {
          console.error(`🎙️ DIRECT - ❌ Erreur upload SIMPLIFIÉ:`, errorMessage);
          toast({
            title: "Erreur de sauvegarde",
            description: errorMessage,
            variant: "destructive",
            duration: 3000
          });
        },
        // Callback début upload
        () => {
          console.log(`🎙️ DIRECT - 📤 Début upload SIMPLIFIÉ`);
          setIsUploading(true);
        },
        // Callback fin upload
        () => {
          console.log(`🎙️ DIRECT - 📥 Fin upload SIMPLIFIÉ`);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error(`🎙️ DIRECT - 💥 Erreur non gérée SIMPLIFIÉ:`, error);
      setIsUploading(false);
      
      toast({
        title: "Erreur inattendue",
        description: "Erreur lors du téléchargement de l'audio",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Reset du flag de traitement quand un nouvel enregistrement est possible
  const handleNewRecordingPossible = useCallback(() => {
    console.log("🔄 DIRECT - Reset du flag de traitement SIMPLIFIÉ");
    setHasProcessedCurrentBlob(false);
    setUploadedAudioUrl(null);
  }, []);

  return (
    <div className={`transition-all ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
      <VoiceRecorderForIntervention 
        onAudioChange={(blob) => {
          if (!blob) {
            handleNewRecordingPossible();
          }
          stableHandleAudio(blob);
        }}
      />
      
      {/* États d'upload */}
      {isUploading && (
        <div className="flex items-center justify-center py-2 mt-2 bg-gray-100 rounded-md">
          <Spinner className="h-5 w-5 border-gray-500 mr-2" />
          <span className="text-sm text-gray-700">Sauvegarde en cours...</span>
        </div>
      )}
      
      {uploadedAudioUrl && !isUploading && (
        <div className="py-2 mt-2 bg-green-100 rounded-md text-center">
          <span className="text-sm text-green-700">✓ Audio sauvegardé avec succès</span>
        </div>
      )}
      
      {!reportId && !isUploading && (
        <div className="py-2 mt-2 bg-yellow-100 rounded-md text-center">
          <span className="text-sm text-yellow-700">⚠ Sauvegarde différée (en attente du rapport)</span>
        </div>
      )}
    </div>
  );
};

export default DirectAudioRecorder;
