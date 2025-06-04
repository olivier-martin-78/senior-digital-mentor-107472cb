
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChapterNavigation from './ChapterNavigation';
import ChapterContent from './ChapterContent';
import { Chapter } from '@/types/lifeStory';

interface LifeStoryLayoutProps {
  chapters: Chapter[];
  activeTab: string;
  openQuestions: { [key: string]: boolean };
  activeQuestion: string | null;
  isReadOnly: boolean;
  setActiveTab: (tab: string) => void;
  toggleQuestions: (chapterId: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
  onAudioUrlChange?: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
}

const LifeStoryLayout: React.FC<LifeStoryLayoutProps> = ({
  chapters,
  activeTab,
  openQuestions,
  activeQuestion,
  isReadOnly,
  setActiveTab,
  toggleQuestions,
  handleQuestionFocus,
  updateAnswer,
  onAudioRecorded,
  onAudioDeleted,
  onAudioUrlChange,
}) => {
  console.log('📋 LifeStoryLayout - Props reçues:', {
    isReadOnly,
    chaptersCount: chapters.length,
    activeTab
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Navigation des chapitres */}
      <div className="lg:col-span-1">
        <ChapterNavigation
          chapters={chapters}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openQuestions={openQuestions}
          toggleQuestions={toggleQuestions}
          activeQuestion={activeQuestion}
          handleQuestionFocus={handleQuestionFocus}
        />
      </div>

      {/* Contenu principal */}
      <div className="lg:col-span-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden">
            {chapters.map((chapter) => (
              <TabsTrigger key={chapter.id} value={chapter.id}>
                {chapter.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {chapters.map((chapter) => (
            <TabsContent key={chapter.id} value={chapter.id} className="mt-0">
              <ChapterContent
                chapter={chapter}
                activeQuestion={activeQuestion}
                isReadOnly={isReadOnly}
                handleQuestionFocus={handleQuestionFocus}
                updateAnswer={updateAnswer}
                onAudioRecorded={onAudioRecorded}
                onAudioDeleted={onAudioDeleted}
                onAudioUrlChange={onAudioUrlChange}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default LifeStoryLayout;
