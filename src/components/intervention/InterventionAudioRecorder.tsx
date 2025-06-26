
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
  
  // Refs pour éviter les uploads multiples et les actions concurrentes
  const isMounted = useRef(true);
  const isProcessing = useRef(false);
  const currentBlobRef = useRef<Blob | null>(null);
  
  console.log('🎤 InterventionAudioRecorder - Rendu:', {
    isUploading,
    uploadedAudioUrl,
    hasExistingUrl: !!existingAudioUrl,
    reportId,
    isProcessing: isProcessing.current
  });
  
  // Effet de nettoyage
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Gestion de l'enregistrement audio avec protection contre les actions concurrentes
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    console.log('🎤 handleAudioChange - Début:', { 
      hasBlob: !!newAudioBlob, 
      blobSize: newAudioBlob?.size,
      isProcessing: isProcessing.current,
      isUploading
    });
    
    // Éviter les traitements concurrents
    if (isProcessing.current) {
      console.log('🎤 Traitement déjà en cours, ignorer');
      return;
    }
    
    // Audio supprimé
    if (!newAudioBlob || newAudioBlob.size === 0) {
      console.log('🎤 Audio supprimé');
      setUploadedAudioUrl(null);
      setIsUploading(false);
      currentBlobRef.current = null;
      onAudioUrlGenerated('');
      return;
    }
    
    // Même blob, pas de traitement nécessaire
    if (currentBlobRef.current === newAudioBlob) {
      console.log('🎤 Même blob, pas de traitement nécessaire');
      return;
    }
    
    // Pas d'utilisateur connecté
    if (!user?.id) {
      console.log('🎤 Pas d\'utilisateur connecté');
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un audio",
        variant: "destructive",
      });
      return;
    }
    
    try {
      isProcessing.current = true;
      currentBlobRef.current = newAudioBlob;
      
      console.log('🎤 Début traitement audio:', newAudioBlob.size, 'octets');
      
      // Notifier immédiatement qu'on a un enregistrement
      onAudioRecorded(newAudioBlob);
      
      // Si on a un reportId, uploader vers Supabase
      if (reportId) {
        console.log('🎤 Upload vers Supabase pour rapport:', reportId);
        setIsUploading(true);
        
        uploadInterventionAudio(
          newAudioBlob,
          user.id,
          reportId,
          // Succès
          (publicUrl: string) => {
            if (isMounted.current) {
              console.log('🎤 ✅ Upload réussi:', publicUrl);
              setUploadedAudioUrl(publicUrl);
              setIsUploading(false);
              onAudioUrlGenerated(publicUrl);
              
              toast({
                title: "Enregistrement sauvegardé",
                description: "Votre enregistrement vocal a été sauvegardé avec succès",
              });
            }
          },
          // Erreur
          (errorMessage: string) => {
            if (isMounted.current) {
              console.error('🎤 ❌ Erreur upload:', errorMessage);
              setIsUploading(false);
              
              // Fallback : URL temporaire
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
          // Début upload
          () => {
            console.log('🎤 📤 Début upload');
          },
          // Fin upload
          () => {
            if (isMounted.current) {
              console.log('🎤 📥 Fin upload');
              setIsUploading(false);
            }
          }
        );
      } else {
        // Pas de reportId : URL temporaire
        console.log('🎤 Création URL temporaire');
        const tempUrl = URL.createObjectURL(newAudioBlob);
        setUploadedAudioUrl(tempUrl);
        onAudioUrlGenerated(tempUrl);
        
        toast({
          title: "Enregistrement prêt",
          description: "Votre enregistrement sera sauvegardé avec le rapport",
        });
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('🎤 💥 Erreur inattendue:', error);
        setIsUploading(false);
        
        toast({
          title: "Erreur inattendue",
          description: "Une erreur est survenue lors de l'enregistrement audio",
          variant: "destructive",
        });
      }
    } finally {
      isProcessing.current = false;
    }
  };

  const handleDeleteExistingAudio = () => {
    console.log('🎤 Suppression manuelle de l\'audio');
    setUploadedAudioUrl(null);
    currentBlobRef.current = null;
    onAudioUrlGenerated('');
  };

  // Afficher le lecteur si on a de l'audio et qu'on n'est pas en train d'uploader
  if (uploadedAudioUrl && !isUploading) {
    console.log('🎤 ✅ Affichage du lecteur');
    return (
      <VoiceAnswerPlayer
        audioUrl={uploadedAudioUrl}
        onDelete={handleDeleteExistingAudio}
        readOnly={false}
        shouldLog={true}
      />
    );
  }

  console.log('🎤 Affichage de l\'enregistreur');
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
