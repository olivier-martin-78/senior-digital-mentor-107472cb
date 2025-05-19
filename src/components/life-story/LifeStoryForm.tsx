
import React from 'react';
import { LifeStory } from '@/types/lifeStory';
import { useLifeStory } from '@/hooks/use-life-story';
import StoryHeader from './StoryHeader';
import StoryProgress from './StoryProgress';
import LifeStoryLayout from './LifeStoryLayout';

interface LifeStoryFormProps {
  existingStory?: LifeStory;
}

export const LifeStoryForm: React.FC<LifeStoryFormProps> = ({ existingStory }) => {
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
  } = useLifeStory({ existingStory });
  
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
    </div>
  );
};

export default LifeStoryForm;
