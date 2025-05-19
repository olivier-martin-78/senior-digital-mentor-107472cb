
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ChapterContent from './ChapterContent';
import { Chapter } from '@/types/lifeStory';

interface ChapterTabsProps {
  chapters: Chapter[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  showVoiceRecorder: string | null;
  handleVoiceRecorder: (questionId: string) => void;
  activeQuestion: string | null;
}

export const ChapterTabs: React.FC<ChapterTabsProps> = ({
  chapters,
  activeTab,
  setActiveTab,
  updateAnswer,
  handleQuestionFocus,
  showVoiceRecorder,
  handleVoiceRecorder,
  activeQuestion
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
        {chapters.slice(0, 5).map(chapter => (
          <TabsTrigger key={chapter.id} value={chapter.id}>
            {chapter.title.split(' ')[0]}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
        {chapters.slice(5).map(chapter => (
          <TabsTrigger key={chapter.id} value={chapter.id}>
            {chapter.title.split(' ')[0]}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {chapters.map(chapter => (
        <TabsContent key={chapter.id} value={chapter.id}>
          <ChapterContent
            chapter={chapter}
            updateAnswer={updateAnswer}
            handleQuestionFocus={handleQuestionFocus}
            showVoiceRecorder={showVoiceRecorder}
            handleVoiceRecorder={handleVoiceRecorder}
            activeQuestion={activeQuestion}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ChapterTabs;
