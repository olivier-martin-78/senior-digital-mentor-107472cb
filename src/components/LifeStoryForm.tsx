
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LifeStory, LifeStoryProgress } from '@/types/lifeStory';
import { initialChapters } from './life-story/initialChapters';
import StoryHeader from './life-story/StoryHeader';
import StoryProgress from './life-story/StoryProgress';
import ChapterNavigation from './life-story/ChapterNavigation';
import ChapterTabs from './life-story/ChapterTabs';

interface LifeStoryFormProps {
  existingStory?: LifeStory;
}

export const LifeStoryForm: React.FC<LifeStoryFormProps> = ({ existingStory }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<string>('ch1');
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState<string | null>(null);
  
  // Initialisation des données de l'histoire
  const initialData: LifeStory = existingStory || {
    title: "Mon histoire de vie",
    chapters: initialChapters,
  };
  
  const { data, updateData, isSaving, lastSaved, saveNow } = useAutoSave({
    initialData,
    userId: user?.id || '',
    onSaveSuccess: (savedStory) => {
      toast({
        title: "Sauvegarde réussie",
        description: "Votre histoire a été sauvegardée avec succès.",
      });
    }
  });
  
  // Calcul de la progression
  const calculateProgress = (): LifeStoryProgress => {
    let total = 0;
    let answered = 0;
    
    data.chapters.forEach(chapter => {
      total += chapter.questions.length;
      answered += chapter.questions.filter(q => q.answer && q.answer.trim().length > 0).length;
    });
    
    return {
      totalQuestions: total,
      answeredQuestions: answered
    };
  };
  
  const progress = calculateProgress();
  
  // Mise à jour d'une réponse
  const updateAnswer = (chapterId: string, questionId: string, answer: string) => {
    const updatedChapters = data.chapters.map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          questions: chapter.questions.map(question => {
            if (question.id === questionId) {
              return { ...question, answer };
            }
            return question;
          })
        };
      }
      return chapter;
    });
    
    updateData({
      chapters: updatedChapters,
      last_edited_chapter: chapterId,
      last_edited_question: questionId,
    });
  };
  
  // Gestion de l'enregistrement vocal
  const handleVoiceRecorder = (questionId: string) => {
    setShowVoiceRecorder(showVoiceRecorder === questionId ? null : questionId);
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
  
  return (
    <div className="space-y-6">
      <StoryHeader 
        title={data.title} 
        lastSaved={lastSaved} 
        isSaving={isSaving} 
        onSave={saveNow} 
      />
      
      {/* Barre de progression */}
      <StoryProgress progress={progress} />
      
      {/* Navigation des chapitres */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <ChapterNavigation 
            chapters={data.chapters}
            activeTab={activeTab}
            openQuestions={openQuestions}
            activeQuestion={activeQuestion}
            setActiveTab={setActiveTab}
            toggleQuestions={toggleQuestions}
            handleQuestionFocus={handleQuestionFocus}
          />
        </div>
        
        {/* Contenu des chapitres */}
        <div className="md:w-2/3">
          <ChapterTabs 
            chapters={data.chapters}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            updateAnswer={updateAnswer}
            handleQuestionFocus={handleQuestionFocus}
            showVoiceRecorder={showVoiceRecorder}
            handleVoiceRecorder={handleVoiceRecorder}
            activeQuestion={activeQuestion}
          />
        </div>
      </div>
    </div>
  );
};

export default LifeStoryForm;
