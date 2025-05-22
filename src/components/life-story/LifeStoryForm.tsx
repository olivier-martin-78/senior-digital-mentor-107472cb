
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
  // Si aucune histoire existante ou s'il n'y a pas de chapitres, utiliser les chapitres initiaux
  const storyWithChapters = existingStory && existingStory.chapters.length > 0 
    ? existingStory 
    : { 
        ...existingStory, 
        chapters: initialChapters 
      };

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
