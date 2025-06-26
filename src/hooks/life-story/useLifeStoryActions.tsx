
import { LifeStory } from '@/types/lifeStory';

interface UseLifeStoryActionsProps {
  data: LifeStory | null;
  setData: (data: LifeStory | null) => void;
  isSaving: boolean;
  setPendingSave: (pending: boolean) => void;
  saveNow: () => void;
  effectiveUserId?: string;
}

// Fonction utilitaire pour extraire le chemin relatif d'une URL complète
const extractRelativePath = (audioUrl: string | null): string | null => {
  if (!audioUrl || typeof audioUrl !== 'string' || audioUrl.trim() === '') {
    return null;
  }
  
  const trimmed = audioUrl.trim();
  
  // Si c'est déjà un chemin relatif (pas d'http/https), le retourner tel quel
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Extraire le chemin relatif depuis une URL complète
  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split('/');
    
    // Chercher le bucket name dans le chemin
    const bucketIndex = pathParts.findIndex(part => part === 'life-story-audios');
    if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
      // Retourner tout ce qui vient après le nom du bucket
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    
    // Fallback: prendre juste le nom du fichier
    return pathParts[pathParts.length - 1] || null;
  } catch (error) {
    console.warn('Erreur lors de l\'extraction du chemin relatif:', error);
    return trimmed;
  }
};

export const useLifeStoryActions = ({ 
  data, 
  setData, 
  isSaving, 
  setPendingSave, 
  saveNow,
  effectiveUserId 
}: UseLifeStoryActionsProps) => {

  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    if (!data) return;

    console.log('📝 Mise à jour réponse:', { chapterId, questionId, answer, dataUserId: data.user_id });
    
    const updatedChapters = data.chapters.map(chapter => 
      chapter.id === chapterId ? {
        ...chapter,
        questions: chapter.questions.map(question =>
          question.id === questionId ? { ...question, answer } : question
        )
      } : chapter
    );

    setData({ ...data, chapters: updatedChapters });
  };

  const handleAudioRecorded = (chapterId: string, questionId: string, audioBlob: Blob, audioPath?: string) => {
    if (!data) return;

    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🎤 RECORD - Question 1 Chapitre 1 - Audio enregistré (HOOK):', {
        chapterId,
        questionId,
        audioPath,
        audioBlobSize: audioBlob.size,
        dataUserId: data.user_id,
        effectiveUserId,
        timestamp: new Date().toISOString()
      });
    }

    const updatedChapters = data.chapters.map(chapter => 
      chapter.id === chapterId ? {
        ...chapter,
        questions: chapter.questions.map(question =>
          question.id === questionId 
            ? { ...question, audioBlob } 
            : question
        )
      } : chapter
    );

    setData({ ...data, chapters: updatedChapters });
  };

  const handleAudioDeleted = (chapterId: string, questionId: string) => {
    if (!data) return;

    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🗑️ DELETE - Question 1 Chapitre 1 - Audio supprimé:', {
        chapterId,
        questionId,
        dataUserId: data.user_id,
        effectiveUserId,
        timestamp: new Date().toISOString()
      });
    }

    const updatedChapters = data.chapters.map(chapter => 
      chapter.id === chapterId ? {
        ...chapter,
        questions: chapter.questions.map(question =>
          question.id === questionId 
            ? { ...question, audioBlob: null, audioUrl: null } 
            : question
        )
      } : chapter
    );

    setData({ ...data, chapters: updatedChapters });
    
    // Sauvegarde automatique pour la suppression
    console.log('💾 Déclenchement sauvegarde automatique pour suppression audio');
    setTimeout(() => {
      if (!isSaving) {
        saveNow();
      }
    }, 100);
  };

  const handleAudioUrlChange = (chapterId: string, questionId: string, audioPath: string | null) => {
    if (!data) return;

    // LOG DÉTAILLÉ pour question 1 chapitre 1
    if (chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🔄 URL_CHANGE - Question 1 Chapitre 1 - Changement chemin audio (HOOK):', {
        chapterId,
        questionId,
        audioPath,
        audioPathType: typeof audioPath,
        dataUserId: data.user_id,
        effectiveUserId,
        timestamp: new Date().toISOString()
      });
    }

    // CORRECTION: Extraire le chemin relatif et validation stricte
    const validRelativePath = extractRelativePath(audioPath);
    
    if (chapterId === 'chapter-1' && questionId === 'question-1') {
      console.log('🔄 URL_CHANGE - Question 1 Chapitre 1 - Chemin relatif extrait:', {
        originalPath: audioPath,
        extractedPath: validRelativePath,
        isValidPath: !!validRelativePath
      });
    }

    const updatedChapters = data.chapters.map(chapter => 
      chapter.id === chapterId ? {
        ...chapter,
        questions: chapter.questions.map(question =>
          question.id === questionId 
            ? { ...question, audioUrl: validRelativePath } 
            : question
        )
      } : chapter
    );

    // Mettre à jour l'état local immédiatement
    setData({ ...data, chapters: updatedChapters });
    
    // SAUVEGARDE AUTOMATIQUE IMMÉDIATE pour les nouveaux audios
    if (validRelativePath) {
      console.log('💾 NOUVEAU AUDIO - Sauvegarde automatique IMMÉDIATE pour:', { chapterId, questionId });
      
      // Sauvegarde immédiate sans délai pour les nouveaux audios
      setTimeout(() => {
        if (!isSaving) {
          console.log('✅ Exécution immédiate de la sauvegarde automatique pour nouvel audio');
          saveNow();
        } else {
          console.log('⏳ Sauvegarde en cours, programmation d\'une sauvegarde différée');
          // Marquer qu'une sauvegarde est en attente
          setPendingSave(true);
          
          // Vérifier périodiquement si on peut sauvegarder
          const checkAndSave = () => {
            setTimeout(() => {
              if (!isSaving && setPendingSave) {
                console.log('✅ Exécution différée de la sauvegarde automatique pour nouvel audio');
                saveNow();
              } else if (isSaving) {
                // Réessayer si encore en cours de sauvegarde
                checkAndSave();
              }
            }, 500);
          };
          checkAndSave();
        }
      }, 50); // Délai très court pour la stabilisation
    } else {
      // Pour la suppression d'audio, sauvegarde normale
      console.log('💾 Déclenchement sauvegarde automatique pour suppression audio');
      setTimeout(() => {
        if (!isSaving) {
          saveNow();
        } else {
          setPendingSave(true);
        }
      }, 100);
    }
  };

  return {
    updateAnswer,
    handleAudioRecorded,
    handleAudioDeleted,
    handleAudioUrlChange
  };
};
