
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Chapter } from '@/types/lifeStory';

interface ChapterNavigationProps {
  chapters: Chapter[];
  activeTab: string;
  openQuestions: Record<string, boolean>;
  activeQuestion: string | null;
  setActiveTab: (id: string) => void;
  toggleQuestions: (id: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
}

export const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  chapters,
  activeTab,
  openQuestions,
  activeQuestion,
  setActiveTab,
  toggleQuestions,
  handleQuestionFocus
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Chapitres</CardTitle>
        <CardDescription>Naviguez entre les différentes parties de votre histoire</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {chapters.map(chapter => (
            <div key={chapter.id} className="space-y-1">
              <div
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${activeTab === chapter.id ? 'bg-gray-100 font-medium' : ''}`}
                onClick={() => {
                  setActiveTab(chapter.id);
                  toggleQuestions(chapter.id);
                }}
              >
                <span>{chapter.title}</span>
                <Button variant="ghost" size="icon" onClick={(e) => {
                  e.stopPropagation();
                  toggleQuestions(chapter.id);
                }}>
                  {openQuestions[chapter.id] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {openQuestions[chapter.id] && (
                <div className="ml-4 pl-2 border-l space-y-1">
                  {chapter.questions.map((question, i) => (
                    <div
                      key={question.id}
                      className={`p-1 text-sm rounded cursor-pointer hover:bg-gray-50 ${activeQuestion === `${chapter.id}:${question.id}` ? 'bg-gray-50 font-medium' : ''}`}
                      onClick={() => {
                        setActiveTab(chapter.id);
                        handleQuestionFocus(chapter.id, question.id);
                      }}
                    >
                      <span className={question.answer ? 'text-green-600' : 'text-gray-500'}>
                        {i + 1}. {question.text.length > 40 ? `${question.text.substring(0, 40)}...` : question.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChapterNavigation;
