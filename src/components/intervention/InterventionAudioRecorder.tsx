
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VoiceRecorder from '@/components/VoiceRecorder';
import { uploadInterventionAudio } from '@/utils/interventionAudioUtils';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';

interface InterventionAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated: (url: string) => void;
  existingAudioUrl?: string | null;
  reportId?: string;
}

const InterventionAudioRecorder: React.FC<InterventionAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  existingAudioUrl,
  reportId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const { user } = useAuth();
  
  // Utiliser des refs pour éviter les uploads multiples
  const isMounted = useRef(true);
  const currentUploadRef = useRef<string | null>(null);
  
  console.log('🎤 INTERVENTION_AUDIO_RECORDER - Rendu avec:', {
    isUploading,
    uploadedAudioUrl,
    hasExistingUrl: !!existingAudioUrl,
    reportId
  });
  
  // Effet de nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Gestion de l'enregistrement audio
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    console.log("🎤 INTERVENTION_AUDIO_RECORDER - handleAudioChange:", { 
      hasBlob: !!newAudioBlob, 
      blobSize: newAudioBlob?.size,
      isUploading,
      currentUpload: currentUploadRef.current,
    });
    
    // Si pas de blob, audio supprimé
    if (!newAudioBlob || newAudioBlob.size === 0) {
      console.log("🎤 INTERVENTION_AUDIO_RECORDER - Audio supprimé ou vide");
      setUploadedAudioUrl(null);
      setIsUploading(false);
      currentUploadRef.current = null;
      onAudioUrlGenerated('');
      return;
    }
    
    // Si pas d'utilisateur, ne rien faire
    if (!user?.id) {
      console.log("🎤 INTERVENTION_AUDIO_RECORDER - Pas d'utilisateur connecté");
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un audio",
        variant: "destructive",
      });
      return;
    }
    
    // Vérifier si un upload est déjà en cours
    const uploadKey = `intervention-${reportId || 'new'}`;
    if (isUploading || currentUploadRef.current === uploadKey) {
      console.log("🎤 INTERVENTION_AUDIO_RECORDER - Upload déjà en cours:", { uploadKey, isUploading, currentUpload: currentUploadRef.current });
      return;
    }
    
    try {
      console.log(`🎤 INTERVENTION_AUDIO_RECORDER - Début upload, taille: ${newAudioBlob.size} octets`);
      setIsUploading(true);
      currentUploadRef.current = uploadKey;
      
      // Appeler onAudioRecorded immédiatement pour signaler qu'un enregistrement est disponible
      onAudioRecorded(newAudioBlob);
      
      // Si on a un reportId, uploader vers Supabase, sinon créer une URL temporaire
      if (reportId) {
        console.log('🎤 INTERVENTION_AUDIO_RECORDER - Upload vers Supabase pour rapport:', reportId);
        
        uploadInterventionAudio(
          newAudioBlob,
          user.id,
          reportId,
          // Callback de succès
          (publicUrl: string) => {
            if (isMounted.current && currentUploadRef.current === uploadKey) {
              console.log(`🎤 INTERVENTION_AUDIO_RECORDER - ✅ Upload réussi, URL:`, publicUrl);
              setUploadedAudioUrl(publicUrl);
              setIsUploading(false);
              currentUploadRef.current = null;
              onAudioUrlGenerated(publicUrl);
              
              toast({
                title: "Enregistrement sauvegardé",
                description: "Votre enregistrement vocal a été sauvegardé avec succès",
              });
            }
          },
          // Callback d'erreur
          (errorMessage: string) => {
            if (isMounted.current && currentUploadRef.current === uploadKey) {
              console.error(`🎤 INTERVENTION_AUDIO_RECORDER - ❌ Erreur upload:`, errorMessage);
              setIsUploading(false);
              currentUploadRef.current = null;
              
              // Créer une URL temporaire en fallback
              const tempUrl = URL.createObjectURL(newAudioBlob);
              setUploadedAudioUrl(tempUrl);
              onAudioUrlGenerated(tempUrl);
              
              toast({
                title: "Enregistrement temporaire",
                description: "L'enregistrement est sauvé localement. Sauvegardez le rapport pour le conserver.",
                variant: "default",
              });
            }
          },
          // Callback de début d'upload
          () => {
            console.log(`🎤 INTERVENTION_AUDIO_RECORDER - 📤 Début téléchargement`);
          },
          // Callback de fin d'upload
          () => {
            if (isMounted.current && currentUploadRef.current === uploadKey) {
              console.log(`🎤 INTERVENTION_AUDIO_RECORDER - 📥 Fin téléchargement`);
              setIsUploading(false);
              currentUploadRef.current = null;
            }
          }
        );
      } else {
        // Pas de reportId, créer une URL temporaire
        console.log('🎤 INTERVENTION_AUDIO_RECORDER - Création URL temporaire (nouveau rapport)');
        const tempUrl = URL.createObjectURL(newAudioBlob);
        setUploadedAudioUrl(tempUrl);
        setIsUploading(false);
        currentUploadRef.current = null;
        onAudioUrlGenerated(tempUrl);
        
        toast({
          title: "Enregistrement prêt",
          description: "Votre enregistrement sera sauvegardé avec le rapport",
        });
      }
    } catch (error) {
      if (isMounted.current && currentUploadRef.current === uploadKey) {
        console.error(`🎤 INTERVENTION_AUDIO_RECORDER - 💥 Erreur non gérée:`, error);
        setIsUploading(false);
        currentUploadRef.current = null;
        
        toast({
          title: "Erreur inattendue",
          description: "Une erreur est survenue lors de l'enregistrement audio",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteExistingAudio = () => {
    console.log('🎤 INTERVENTION_AUDIO_RECORDER - Suppression manuelle de l\'audio existant');
    setUploadedAudioUrl(null);
    onAudioUrlGenerated('');
  };

  // Si un audio existe et qu'on n'est pas en train d'uploader, afficher le lecteur
  if (uploadedAudioUrl && !isUploading) {
    console.log('🎤 INTERVENTION_AUDIO_RECORDER - ✅ Affichage du lecteur avec URL:', uploadedAudioUrl);
    return (
      <VoiceAnswerPlayer
        audioUrl={uploadedAudioUrl}
        onDelete={handleDeleteExistingAudio}
        readOnly={false}
        shouldLog={true}
      />
    );
  }

  console.log('🎤 INTERVENTION_AUDIO_RECORDER - Affichage de l\'enregistreur');
  return (
    <div className={`transition-all ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
      <VoiceRecorder onAudioChange={handleAudioChange} />
      
      {isUploading && (
        <div className="flex items-center justify-center py-2 mt-2 bg-gray-100 rounded-md">
          <Spinner className="h-5 w-5 border-gray-500 mr-2" />
          <span className="text-sm text-gray-700">Sauvegarde en cours...</span>
        </div>
      )}
    </div>
  );
};

export default InterventionAudioRecorder;
