
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mic, Trash } from 'lucide-react';
import VoiceRecorder from '@/components/VoiceRecorder';
import { Question } from '@/types/lifeStory';
import { supabase } from '@/integrations/supabase/client';
import { getPublicUrl } from '@/utils/storageUtils';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface QuestionItemProps {
  question: Question;
  chapterId: string;
  onAnswerChange: (chapterId: string, questionId: string, answer: string) => void;
  onQuestionFocus: (chapterId: string, questionId: string) => void;
  showVoiceRecorder: string | null;
  onToggleVoiceRecorder: (questionId: string) => void;
  activeQuestion: string | null;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null) => void;
}

// Nom du bucket Supabase pour stocker les fichiers audio
const AUDIO_BUCKET_NAME = 'life-story-audios';

export const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  chapterId,
  onAnswerChange,
  onQuestionFocus,
  showVoiceRecorder,
  onToggleVoiceRecorder,
  activeQuestion,
  onAudioUrlChange
}) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  
  // Détecter quand un nouvel enregistrement audio est créé
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    setAudioBlob(newAudioBlob);
    
    if (newAudioBlob) {
      await uploadAudio(newAudioBlob);
    }
  };
  
  // Fonction simplifiée pour vérifier si le bucket existe et est accessible
  const checkBucketAccess = async (): Promise<boolean> => {
    try {
      console.log(`Vérification de l'accès au bucket ${AUDIO_BUCKET_NAME}...`);
      
      // Essayer d'obtenir une liste vide du bucket (juste pour vérifier l'accès)
      const { data, error } = await supabase.storage
        .from(AUDIO_BUCKET_NAME)
        .list('', { limit: 1 });
      
      if (error) {
        console.error(`Erreur d'accès au bucket ${AUDIO_BUCKET_NAME}:`, error);
        return false;
      }
      
      console.log(`Accès au bucket ${AUDIO_BUCKET_NAME} réussi.`);
      return true;
    } catch (error) {
      console.error(`Exception lors de la vérification du bucket ${AUDIO_BUCKET_NAME}:`, error);
      return false;
    }
  };
  
  // Fonction pour télécharger l'audio vers Supabase
  const uploadAudio = async (blob: Blob) => {
    if (!blob || !user) {
      console.error("Blob ou utilisateur non défini");
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Vérifier si le bucket est accessible
      const bucketAccessible = await checkBucketAccess();
      
      if (!bucketAccessible) {
        toast({
          title: 'Erreur de stockage',
          description: `Impossible d'accéder au service de stockage. Veuillez réessayer plus tard ou contacter l'assistance.`,
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }
      
      // Créer un nom de fichier unique avec l'ID de l'utilisateur, de la question et un timestamp
      const userId = user.id;
      const fileName = `${userId}/${chapterId}_${question.id}_${Date.now()}.webm`;
      
      console.log(`Téléchargement du fichier audio vers ${AUDIO_BUCKET_NAME}/${fileName}...`);
      
      // Télécharger le fichier
      const { data, error } = await supabase.storage
        .from(AUDIO_BUCKET_NAME)
        .upload(fileName, blob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Erreur détaillée lors du téléchargement:', error);
        throw error;
      }
      
      console.log('Téléchargement réussi, récupération de l\'URL publique...');
      
      // Obtenir l'URL publique
      const publicUrl = getPublicUrl(fileName, AUDIO_BUCKET_NAME);
      console.log('URL publique obtenue:', publicUrl);
      
      // Mettre à jour la question avec l'URL de l'audio
      onAudioUrlChange(chapterId, question.id, publicUrl);
      
      toast({
        title: 'Audio enregistré',
        description: 'Votre enregistrement audio a été sauvegardé avec succès.',
      });
      
    } catch (error: any) {
      console.error('Erreur lors du téléchargement de l\'audio:', error);
      let errorMessage = 'Impossible de sauvegarder l\'enregistrement audio.';
      
      if (error.statusCode === 403) {
        errorMessage += ' Problème d\'autorisation avec le bucket de stockage.';
      } else if (error.message) {
        errorMessage += ` Erreur: ${error.message}`;
      }
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Fonction pour supprimer un fichier audio
  const handleDeleteAudio = async () => {
    if (!question.audioUrl || !user) return;
    
    try {
      // Extraire le chemin de fichier de l'URL complète
      const fileUrl = question.audioUrl;
      
      // Utiliser une expression régulière plus flexible pour extraire le chemin
      const filePathMatch = fileUrl.includes(`${AUDIO_BUCKET_NAME}/`) 
        ? fileUrl.split(`${AUDIO_BUCKET_NAME}/`)[1].split('?')[0]
        : null;
      
      if (!filePathMatch) {
        console.error('Impossible d\'extraire le chemin du fichier:', fileUrl);
        console.log('Format d\'URL:', fileUrl);
        throw new Error('Format d\'URL invalide');
      }
      
      const filePath = filePathMatch;
      console.log(`Suppression du fichier ${filePath} du bucket ${AUDIO_BUCKET_NAME}...`);
      
      // Supprimer le fichier de Supabase Storage
      const { error } = await supabase.storage
        .from(AUDIO_BUCKET_NAME)
        .remove([filePath]);
      
      if (error) {
        console.error('Erreur lors de la suppression:', error);
        throw error;
      }
      
      console.log('Fichier supprimé avec succès');
      
      // Mettre à jour la question pour supprimer la référence à l'audio
      onAudioUrlChange(chapterId, question.id, null);
      
      toast({
        title: 'Audio supprimé',
        description: 'L\'enregistrement audio a été supprimé avec succès.',
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'audio:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer l\'enregistrement audio. ${error.message || ''}`,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-tranches-charcoal">{question.text}</h3>
      
      <div className="space-y-4">
        <Textarea
          placeholder="Votre réponse..."
          value={question.answer || ''}
          onChange={(e) => onAnswerChange(chapterId, question.id, e.target.value)}
          onFocus={() => onQuestionFocus(chapterId, question.id)}
          className="min-h-[120px]"
        />
        
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onQuestionFocus(chapterId, question.id);
              onToggleVoiceRecorder(question.id);
            }}
          >
            <Mic className="w-4 h-4 mr-2" />
            {showVoiceRecorder === question.id 
              ? 'Cacher l\'enregistrement' 
              : 'Répondre par la voix'}
          </Button>
        </div>
        
        {/* Afficher l'audio existant */}
        {question.audioUrl && (
          <div className="mt-2 p-3 border rounded-md bg-gray-50">
            <div className="text-sm font-medium mb-2">Enregistrement audio existant</div>
            <audio src={question.audioUrl} controls className="w-full mb-2" />
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeleteAudio}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="w-4 h-4 mr-1" /> Supprimer l'audio
              </Button>
            </div>
          </div>
        )}
        
        {/* Afficher l'enregistreur vocal */}
        {showVoiceRecorder === question.id && (
          <div className={isUploading ? "opacity-50 pointer-events-none" : ""}>
            <VoiceRecorder onAudioChange={handleAudioChange} />
            {isUploading && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent mr-2"></div>
                <span className="text-sm text-gray-500">Téléchargement en cours...</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Separator className="my-4" />
    </div>
  );
};

export default QuestionItem;
