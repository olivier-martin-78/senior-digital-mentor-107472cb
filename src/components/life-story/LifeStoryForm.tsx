
import React from 'react';
import { LifeStory } from '@/types/lifeStory';
import { useLifeStory } from '@/hooks/use-life-story';
import StoryHeader from './StoryHeader';
import StoryProgress from './StoryProgress';
import LifeStoryLayout from './LifeStoryLayout';
import { initialChapters } from './initialChapters';

interface LifeStoryFormProps {
  existingStory?: LifeStory;
  isReadOnly?: boolean;
}

export const LifeStoryForm: React.FC<LifeStoryFormProps> = ({ 
  existingStory,
  isReadOnly = false 
}) => {
  // Déterminer l'utilisateur cible depuis l'histoire existante
  const targetUserId = existingStory?.user_id;

  // Toujours utiliser tous les chapitres initiaux pour tous les utilisateurs
  const storyWithChapters = {
    ...existingStory,
    chapters: initialChapters,
    // Si une histoire existe, préserver les réponses existantes sans filtrer les chapitres ou questions
    ...(existingStory && {
      chapters: initialChapters.map(initialChapter => {
        // Chercher le chapitre correspondant dans l'histoire existante
        const existingChapter = existingStory.chapters.find(ch => ch.id === initialChapter.id);
        
        // Préserver les réponses des questions existantes, mais garantir que TOUTES les questions
        // du chapitre initial sont présentes
        return {
          ...initialChapter,
          questions: initialChapter.questions.map(initialQuestion => {
            // Chercher si cette question existe déjà dans les données de l'utilisateur
            const existingQuestion = existingChapter?.questions.find(q => q.id === initialQuestion.id);
            
            // Si la question existe, préserver sa réponse et l'audio
            if (existingQuestion) {
              return {
                ...initialQuestion,
                answer: existingQuestion.answer || initialQuestion.answer,
                audioUrl: existingQuestion.audioUrl || initialQuestion.audioUrl,
                audioBlob: existingQuestion.audioBlob || initialQuestion.audioBlob,
              };
            }
            
            return initialQuestion;
          }),
        };
      }),
    }),
  };

  console.log('Histoire avec chapitres complets:', storyWithChapters);

  const lifeStoryHook = useLifeStory({ targetUserId });
  
  console.log('Chapitres dans LifeStoryForm:', lifeStoryHook.data?.chapters);
  
  // Si nous avons une histoire existante, utiliser ses données
  const displayData = existingStory ? storyWithChapters : lifeStoryHook.data;
  
  if (!displayData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Convert activeTab from number to string for component compatibility
  const activeTabString = lifeStoryHook.activeTab.toString();
  
  // Convert openQuestions Set to object for component compatibility
  const openQuestionsObject: { [key: string]: boolean } = {};
  lifeStoryHook.openQuestions.forEach(key => {
    openQuestionsObject[key] = true;
  });
  
  // Wrapper function to convert string to number for setActiveTab
  const handleSetActiveTab = (tab: string) => {
    const tabIndex = parseInt(tab, 10);
    if (!isNaN(tabIndex)) {
      lifeStoryHook.setActiveTab(tabIndex);
    }
  };
  
  // Wrapper function to match expected audio recording signature
  const handleAudioRecorded = (chapterId: string, questionId: string, blob: Blob) => {
    // CORRECTION: Ne pas interférer avec la gestion d'URL, juste logger
    console.log('🎤 LifeStoryForm - handleAudioRecorded appelé pour:', { chapterId, questionId, blobSize: blob.size });
    // L'URL sera gérée par onAudioUrlChange
  };
  
  return (
    <div className="space-y-6">
      <StoryHeader 
        title={displayData.title} 
        lastSaved={lifeStoryHook.lastSaved} 
        isSaving={lifeStoryHook.isSaving} 
        onSave={lifeStoryHook.saveNow} 
      />
      
      {/* Barre de progression */}
      <StoryProgress progress={lifeStoryHook.progress} />
      
      {/* Layout principal avec navigation et contenu */}
      {displayData.chapters.length > 0 ? (
        <LifeStoryLayout
          chapters={displayData.chapters}
          activeTab={activeTabString}
          openQuestions={openQuestionsObject}
          activeQuestion={lifeStoryHook.activeQuestion}
          isReadOnly={isReadOnly}
          setActiveTab={handleSetActiveTab}
          toggleQuestions={lifeStoryHook.toggleQuestions}
          handleQuestionFocus={lifeStoryHook.handleQuestionFocus}
          updateAnswer={lifeStoryHook.updateAnswer}
          onAudioRecorded={handleAudioRecorded}
          onAudioDeleted={lifeStoryHook.handleAudioDeleted}
          onAudioUrlChange={lifeStoryHook.handleAudioUrlChange}
        />
      ) : (
        <div className="p-6 text-center bg-gray-100 rounded-lg">
          <p>Aucun chapitre n'a été trouvé. Veuillez réessayer plus tard.</p>
        </div>
      )}
    </div>
  );
};

export default LifeStoryForm;
