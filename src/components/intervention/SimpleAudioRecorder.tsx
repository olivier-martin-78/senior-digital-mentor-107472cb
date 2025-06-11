
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import VoiceRecorder from '@/components/VoiceRecorder';
import { uploadAudio } from '@/utils/audioUploadUtils';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

interface SimpleAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
}

const SimpleAudioRecorder: React.FC<SimpleAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const { user } = useAuth();

  console.log("🔧 INTERVENTION - SimpleAudioRecorder rendu", {
    hasUser: !!user,
    userId: user?.id,
    isUploading,
    uploadedAudioUrl
  });

  // Gestion de l'enregistrement audio - EXACTEMENT comme dans AudioRecorder.tsx
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    console.log("🎙️ INTERVENTION - handleAudioChange DÉBUT:", { 
      hasBlob: !!newAudioBlob, 
      blobSize: newAudioBlob?.size,
      blobType: newAudioBlob?.type,
      isUploading,
      userConnected: !!user?.id
    });
    
    // Si pas de blob, audio supprimé
    if (!newAudioBlob || newAudioBlob.size === 0) {
      console.log("🎙️ INTERVENTION - Audio supprimé ou vide, reset des états");
      setUploadedAudioUrl(null);
      setIsUploading(false);
      return;
    }
    
    // Si pas d'utilisateur, ne rien faire
    if (!user?.id) {
      console.log("🎙️ INTERVENTION - Pas d'utilisateur connecté, arrêt du processus");
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un audio",
        variant: "destructive",
        duration: 700
      });
      return;
    }
    
    // Vérifier si un upload est déjà en cours
    if (isUploading) {
      console.log("🎙️ INTERVENTION - Upload déjà en cours, ignorer cette requête");
      return;
    }
    
    console.log("🎙️ INTERVENTION - Avant appel onAudioRecorded");
    // Notifier IMMÉDIATEMENT le parent avec le blob
    onAudioRecorded(newAudioBlob);
    console.log("🎙️ INTERVENTION - Après appel onAudioRecorded");
    
    try {
      console.log(`🎙️ INTERVENTION - Début upload, taille: ${newAudioBlob.size} octets, type: ${newAudioBlob.type}`);
      setIsUploading(true);
      
      // Tentative de téléchargement de l'audio
      await uploadAudio(
        newAudioBlob,
        user.id,
        'intervention',
        'audio-record',
        // Callback de succès
        (publicUrl) => {
          console.log(`🎙️ INTERVENTION - ✅ Upload réussi, URL:`, publicUrl);
          setUploadedAudioUrl(publicUrl);
          setIsUploading(false);
          
          // Notifier le parent de l'URL générée
          if (onAudioUrlGenerated) {
            console.log(`🎙️ INTERVENTION - Appel onAudioUrlGenerated avec:`, publicUrl);
            onAudioUrlGenerated(publicUrl);
          }
          
          console.log('🎙️ INTERVENTION - Toast de succès affiché');
          toast({
            title: "Enregistrement sauvegardé",
            description: "Votre enregistrement vocal a été sauvegardé avec succès",
            duration: 700
          });
        },
        // Callback d'erreur
        (errorMessage) => {
          console.error(`🎙️ INTERVENTION - ❌ Erreur upload:`, errorMessage);
          setIsUploading(false);
          
          toast({
            title: "Erreur de sauvegarde",
            description: errorMessage,
            variant: "destructive",
            duration: 700
          });
        },
        // Callback de début d'upload
        () => {
          console.log(`🎙️ INTERVENTION - 📤 Début téléchargement`);
        },
        // Callback de fin d'upload
        () => {
          console.log(`🎙️ INTERVENTION - 📥 Fin téléchargement`);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error(`🎙️ INTERVENTION - 💥 Erreur non gérée dans handleAudioChange:`, error);
      setIsUploading(false);
      
      toast({
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors du téléchargement de l'audio",
        variant: "destructive",
        duration: 700
      });
    }
  };

  console.log("🔧 INTERVENTION - SimpleAudioRecorder avant render final");

  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <div className="text-sm font-medium mb-3 text-gray-700">Enregistrement vocal</div>
      
      <div className={`transition-all ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
        <VoiceRecorder onAudioChange={handleAudioChange} />
        
        {isUploading && (
          <div className="flex items-center justify-center py-2 mt-2 bg-gray-100 rounded-md">
            <Spinner className="h-5 w-5 border-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Sauvegarde en cours...</span>
          </div>
        )}
        
        {uploadedAudioUrl && !isUploading && uploadedAudioUrl !== 'local-audio' && (
          <div className="py-2 mt-2 bg-green-100 rounded-md text-center">
            <span className="text-sm text-green-700">✓ Audio sauvegardé avec succès</span>
          </div>
        )}
        
        {uploadedAudioUrl === 'local-audio' && !isUploading && (
          <div className="py-2 mt-2 bg-yellow-100 rounded-md text-center">
            <span className="text-sm text-yellow-700">⚠ Audio local uniquement</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleAudioRecorder;
