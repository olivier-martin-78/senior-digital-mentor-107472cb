
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoSave } from '@/hooks/use-auto-save';
import { toast } from '@/hooks/use-toast';
import { LifeStory, LifeStoryProgress, Chapter } from '@/types/lifeStory';
import { initialChapters } from '@/components/life-story/initialChapters';

interface UseLifeStoryProps {
  existingStory?: LifeStory;
}

export function useLifeStory({ existingStory }: UseLifeStoryProps) {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>(
    existingStory?.last_edited_chapter || 'ch1'
  );
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});
  const [activeQuestion, setActiveQuestion] = useState<string | null>(
    existingStory?.last_edited_question ? 
      `${existingStory.last_edited_chapter}:${existingStory.last_edited_question}` : 
      null
  );
  
  // Initialisation des données de l'histoire
  const initialData: LifeStory = existingStory || {
    title: "Mon histoire de vie",
    chapters: initialChapters,
  };
  
  const { data, updateData, isSaving, lastSaved, saveNow } = useAutoSave({
    initialData,
    userId: user?.id || '',
    onSaveSuccess: () => {
      // Pas de notification ici car la sauvegarde automatique est désactivée
    }
  });
  
  // Calcul de la progression
  const calculateProgress = (): LifeStoryProgress => {
    let total = 0;
    let answered = 0;
    
    data.chapters.forEach(chapter => {
      total += chapter.questions.length;
      answered += chapter.questions.filter(q => 
        (q.answer && q.answer.trim().length > 0) || 
        (q.audioAnswer && q.audioAnswer.trim().length > 0)
      ).length;
    });
    
    return {
      totalQuestions: total,
      answeredQuestions: answered
    };
  };
  
  const progress = calculateProgress();
  
  // Mise à jour d'une réponse textuelle
  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    const updatedChapters = updateChapterQuestion(data.chapters, chapterId, questionId, { answer });
    
    updateData({
      chapters: updatedChapters,
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    });
  };
  
  // Gestion du focus sur une question
  const handleQuestionFocus = (chapterId: string, questionId: string) => {
    setActiveQuestion(`${chapterId}:${questionId}`);
  };
  
  // Toggle pour ouvrir/fermer les questions dans un chapitre
  const toggleQuestions = (chapterId: string) => {
    setOpenQuestions(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };
  
  // Helper function to update a specific question in a chapter
  const updateChapterQuestion = (
    chapters: Chapter[], 
    chapterId: string, 
    questionId: string, 
    updates: Record<string, any>
  ) => {
    return chapters.map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          questions: chapter.questions.map(question => {
            if (question.id === questionId) {
              return { ...question, ...updates };
            }
            return question;
          })
        };
      }
      return chapter;
    });
  };
  
  // Gestion des enregistrements audio
  const handleAudioRecorded = (chapterId: string, questionId: string, audioBlob: Blob, audioUrl: string) => {
    console.log(`Enregistrement audio pour la question ${questionId} du chapitre ${chapterId}`, audioBlob);
    
    // Mettre à jour la question avec l'URL de l'audio
    const updatedChapters = updateChapterQuestion(
      data.chapters, 
      chapterId, 
      questionId, 
      { audioAnswer: audioUrl }
    );
    
    updateData({
      chapters: updatedChapters,
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    });
    
    // Afficher une notification de succès
    toast({
      title: "Enregistrement audio",
      description: "Votre réponse vocale a été enregistrée avec succès.",
      duration: 3000
    });
  };
  
  // Gestion de la suppression d'un audio
  const handleAudioDeleted = (chapterId: string, questionId: string) => {
    console.log(`Suppression de l'audio pour la question ${questionId} du chapitre ${chapterId}`);
    
    // Mettre à jour les données pour supprimer l'audio
    const updatedChapters = data.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          questions: chapter.questions.map(question => {
            if (question.id === questionId) {
              // Supprimer l'audioAnswer
              const { audioAnswer, ...rest } = question;
              return rest;
            }
            return question;
          })
        };
      }
      return chapter;
    });
    
    updateData({
      chapters: updatedChapters
    });
    
    // Afficher une notification
    toast({
      title: "Audio supprimé",
      description: "L'enregistrement vocal a été supprimé.",
      duration: 3000
    });
  };
  
  return {
    data,
    activeTab,
    openQuestions,
    activeQuestion,
    progress,
    isSaving,
    lastSaved,
    setActiveTab,
    toggleQuestions,
    handleQuestionFocus,
    updateAnswer,
    handleAudioRecorded,
    handleAudioDeleted,
    saveNow
  };
}
