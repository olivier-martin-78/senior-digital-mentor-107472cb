
// src/components/life-story/ChapterTabs.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChapterContent from './ChapterContent';
import { Chapter } from '@/types/lifeStory';

interface ChapterTabsProps {
  chapters: Chapter[];
  activeTab: string;
  setActiveTab: (value: string) => void;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  activeQuestion: string | null;
  isReadOnly: boolean;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
  onAudioUrlChange?: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
}

export const ChapterTabs: React.FC<ChapterTabsProps> = ({
  chapters,
  activeTab,
  setActiveTab,
  updateAnswer,
  handleQuestionFocus,
  activeQuestion,
  isReadOnly,
  onAudioRecorded,
  onAudioDeleted,
  onAudioUrlChange,
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="flex flex-wrap gap-2 justify-start pb-8">
        {chapters.map(chapter => (
          <TabsTrigger 
            key={chapter.id}
            value={chapter.id}
            className="whitespace-nowrap mb-2"
          >
            {chapter.title}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {chapters.map(chapter => (
        <TabsContent key={chapter.id} value={chapter.id} className="mt-6">
          <ChapterContent
            chapter={chapter}
            updateAnswer={updateAnswer}
            handleQuestionFocus={handleQuestionFocus}
            activeQuestion={activeQuestion}
            isReadOnly={isReadOnly}
            onAudioRecorded={onAudioRecorded}
            onAudioDeleted={onAudioDeleted}
            onAudioUrlChange={onAudioUrlChange}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ChapterTabs;
