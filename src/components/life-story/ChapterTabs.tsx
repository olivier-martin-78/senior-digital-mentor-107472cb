
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
  onAudioRecorded: (chapterId: string, questionId: string, audioBlob: Blob, audioUrl: string) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
}

export const ChapterTabs: React.FC<ChapterTabsProps> = ({
  chapters,
  activeTab,
  setActiveTab,
  updateAnswer,
  handleQuestionFocus,
  activeQuestion,
  onAudioRecorded,
  onAudioDeleted
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {chapters.map(chapter => (
          <TabsTrigger 
            key={chapter.id}
            value={chapter.id}
            className="whitespace-nowrap"
          >
            {chapter.title}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {chapters.map(chapter => (
        <TabsContent key={chapter.id} value={chapter.id}>
          <ChapterContent
            chapter={chapter}
            updateAnswer={updateAnswer}
            handleQuestionFocus={handleQuestionFocus}
            activeQuestion={activeQuestion}
            onAudioRecorded={onAudioRecorded}
            onAudioDeleted={onAudioDeleted}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ChapterTabs;
