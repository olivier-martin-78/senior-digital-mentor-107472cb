
import React from 'react';
import { Chapter } from '@/types/lifeStory';
import ChapterNavigation from './ChapterNavigation';
import ChapterTabs from './ChapterTabs';

interface LifeStoryLayoutProps {
  chapters: Chapter[];
  activeTab: string;
  openQuestions: Record<string, boolean>;
  activeQuestion: string | null;
  setActiveTab: (value: string) => void;
  toggleQuestions: (chapterId: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  onAudioRecorded: (chapterId: string, questionId: string, audioBlob: Blob, audioUrl: string) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
}

export const LifeStoryLayout: React.FC<LifeStoryLayoutProps> = ({
  chapters,
  activeTab,
  openQuestions,
  activeQuestion,
  setActiveTab,
  toggleQuestions,
  handleQuestionFocus,
  updateAnswer,
  onAudioRecorded,
  onAudioDeleted
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/3">
        <ChapterNavigation 
          chapters={chapters}
          activeTab={activeTab}
          openQuestions={openQuestions}
          activeQuestion={activeQuestion}
          setActiveTab={setActiveTab}
          toggleQuestions={toggleQuestions}
          handleQuestionFocus={handleQuestionFocus}
        />
      </div>
      
      <div className="md:w-2/3">
        <ChapterTabs 
          chapters={chapters}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          updateAnswer={updateAnswer}
          handleQuestionFocus={handleQuestionFocus}
          activeQuestion={activeQuestion}
          onAudioRecorded={onAudioRecorded}
          onAudioDeleted={onAudioDeleted}
        />
      </div>
    </div>
  );
};

export default LifeStoryLayout;
