
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
  
  // Détecter quand un nouvel enregistrement audio est créé
  const handleAudioChange = async (newAudioBlob: Blob | null) => {
    setAudioBlob(newAudioBlob);
    
    if (newAudioBlob) {
      await uploadAudio(newAudioBlob);
    }
  };
  
  // Vérifier si le bucket existe avant d'essayer de télécharger
  const checkBucketExists = async (bucketName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      if (error) {
        console.error('Erreur lors de la vérification du bucket:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('Exception lors de la vérification du bucket:', error);
      return false;
    }
  };
  
  // Fonction pour télécharger l'audio vers Supabase
  const uploadAudio = async (blob: Blob) => {
    if (!blob) return;
    
    try {
      setIsUploading(true);
      
      // Vérifier si le bucket existe
      const bucketExists = await checkBucketExists('life-story-audios');
      
      if (!bucketExists) {
        toast({
          title: 'Erreur de configuration',
          description: 'Le bucket "life-story-audios" n\'existe pas. Veuillez contacter l\'administrateur.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }
      
      // Créer un nom de fichier unique avec l'ID de la question
      const fileName = `${chapterId}_${question.id}_${Date.now()}.webm`;
      const filePath = `${fileName}`;
      
      // Télécharger le fichier
      const { data, error } = await supabase.storage
        .from('life-story-audios')
        .upload(filePath, blob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Erreur détaillée lors du téléchargement:', JSON.stringify(error));
        throw error;
      }
      
      // Obtenir l'URL publique
      const publicUrl = getPublicUrl(filePath, 'life-story-audios');
      
      // Mettre à jour la question avec l'URL de l'audio
      onAudioUrlChange(chapterId, question.id, publicUrl);
      
      toast({
        title: 'Audio enregistré',
        description: 'Votre enregistrement audio a été sauvegardé avec succès.',
      });
      
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'audio:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'enregistrement audio. Vérifiez que le bucket existe et que vous avez les permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Fonction pour supprimer un fichier audio
  const handleDeleteAudio = async () => {
    if (!question.audioUrl) return;
    
    try {
      // Extraire le chemin de fichier de l'URL complète
      const fileUrl = question.audioUrl;
      const filePathMatch = fileUrl.match(/life-story-audios\/(.+)/);
      
      if (!filePathMatch || !filePathMatch[1]) {
        console.error('Impossible d\'extraire le chemin du fichier:', fileUrl);
        throw new Error('Format d\'URL invalide');
      }
      
      const filePath = filePathMatch[1];
      
      // Supprimer le fichier de Supabase Storage
      const { error } = await supabase.storage
        .from('life-story-audios')
        .remove([filePath]);
      
      if (error) throw error;
      
      // Mettre à jour la question pour supprimer la référence à l'audio
      onAudioUrlChange(chapterId, question.id, null);
      
      toast({
        title: 'Audio supprimé',
        description: 'L\'enregistrement audio a été supprimé avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'audio:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'enregistrement audio.',
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

