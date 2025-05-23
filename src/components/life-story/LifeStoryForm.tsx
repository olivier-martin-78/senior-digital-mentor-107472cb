
import React from 'react';
import { LifeStory } from '@/types/lifeStory';
import { useLifeStory } from '@/hooks/use-life-story';
import StoryHeader from './StoryHeader';
import StoryProgress from './StoryProgress';
import LifeStoryLayout from './LifeStoryLayout';
import { initialChapters } from './initialChapters';

interface LifeStoryFormProps {
  existingStory?: LifeStory;
}

export const LifeStoryForm: React.FC<LifeStoryFormProps> = ({ existingStory }) => {
  // Toujours utiliser tous les chapitres initiaux pour tous les utilisateurs
  const storyWithChapters = {
    ...existingStory,
    chapters: initialChapters,
    // Si une histoire existe, préserver les réponses existantes
    ...(existingStory && existingStory.chapters.length > 0 && {
      chapters: initialChapters.map(initialChapter => {
        // Chercher le chapitre correspondant dans l'histoire existante
        const existingChapter = existingStory.chapters.find(ch => ch.id === initialChapter.id);
        
        // Si le chapitre existe, copier ses questions avec les réponses
        if (existingChapter) {
          return {
            ...initialChapter,
            questions: initialChapter.questions.map(initialQuestion => {
              // Chercher la question correspondante dans le chapitre existant
              const existingQuestion = existingChapter.questions.find(q => q.id === initialQuestion.id);
              
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
        }
        
        return initialChapter;
      }),
    }),
  };

  console.log('Histoire avec chapitres complets:', storyWithChapters);

  const {
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
  } = useLifeStory({ existingStory: storyWithChapters });
  
  console.log('Chapitres dans LifeStoryForm:', data.chapters);
  
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
      
      {/* Layout principal avec navigation et contenu */}
      {data.chapters.length > 0 ? (
        <LifeStoryLayout
          chapters={data.chapters}
          activeTab={activeTab}
          openQuestions={openQuestions}
          activeQuestion={activeQuestion}
          setActiveTab={setActiveTab}
          toggleQuestions={toggleQuestions}
          handleQuestionFocus={handleQuestionFocus}
          updateAnswer={updateAnswer}
          onAudioRecorded={handleAudioRecorded}
          onAudioDeleted={handleAudioDeleted}
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
