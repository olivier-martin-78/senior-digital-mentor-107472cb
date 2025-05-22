// src/components/life-story/LifeStoryLayout.tsx
import React from 'react';
import { Chapter } from '@/types/lifeStory';
import ChapterTabs from './ChapterTabs';

interface LifeStoryLayoutProps {
  chapters: Chapter[];
  activeTab: string;
  openQuestions: { [key: string]: boolean };
  activeQuestion: string | null;
  setActiveTab: (tab: string) => void;
  toggleQuestions: (chapterId: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
}

const LifeStoryLayout: React.FC<LifeStoryLayoutProps> = ({
  chapters,
  activeTab,
  openQuestions,
  activeQuestion,
  setActiveTab,
  toggleQuestions,
  handleQuestionFocus,
  updateAnswer,
  onAudioRecorded,
  onAudioDeleted,
}) => {
  return (
    <div className="space-y-6">
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
  );
};

export default LifeStoryLayout;
