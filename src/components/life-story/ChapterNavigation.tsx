
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import { Chapter } from '@/types/lifeStory';

interface ChapterNavigationProps {
  chapters: Chapter[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  openQuestions: { [key: string]: boolean };
  toggleQuestions: (chapterId: string) => void;
  activeQuestion: string | null;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
}

const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  chapters,
  activeTab,
  setActiveTab,
  openQuestions,
  toggleQuestions,
  activeQuestion,
  handleQuestionFocus,
}) => {
  console.log('🧭 ChapterNavigation - Props reçues:', {
    chaptersCount: chapters.length,
    activeTab,
    openQuestions
  });

  const getQuestionStatus = (question: any) => {
    const hasAnswer = question.answer && question.answer.trim().length > 0;
    const hasAudio = question.audioUrl && question.audioUrl.length > 0;
    return hasAnswer || hasAudio;
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Chapitres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {chapters.map((chapter) => {
          const isActive = activeTab === chapter.id;
          const isOpen = openQuestions[chapter.id];
          const answeredQuestions = chapter.questions?.filter(getQuestionStatus).length || 0;
          const totalQuestions = chapter.questions?.length || 0;
          
          return (
            <div key={chapter.id} className="space-y-1">
              {/* Titre du chapitre */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(chapter.id)}
                  className={`flex-1 justify-start text-left ${
                    isActive ? 'bg-tranches-sage text-white' : ''
                  }`}
                >
                  <span className="truncate">{chapter.title}</span>
                  <span className="ml-auto text-xs opacity-70">
                    {answeredQuestions}/{totalQuestions}
                  </span>
                </Button>
                
                {/* Bouton pour ouvrir/fermer les questions */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleQuestions(chapter.id)}
                  className="p-1 h-8 w-8"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Liste des questions (si ouvert) */}
              {isOpen && chapter.questions && (
                <div className="ml-4 space-y-1">
                  {chapter.questions.map((question, index) => {
                    const hasResponse = getQuestionStatus(question);
                    const isActiveQuestion = activeQuestion === question.id;
                    
                    return (
                      <Button
                        key={question.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveTab(chapter.id);
                          handleQuestionFocus(chapter.id, question.id);
                        }}
                        className={`w-full justify-start text-left text-xs p-2 h-auto min-h-[32px] whitespace-normal ${
                          isActiveQuestion ? 'bg-gray-100' : ''
                        } ${
                          hasResponse ? 'text-green-600 font-medium' : 'text-gray-600'
                        }`}
                      >
                        <div className="flex items-start space-x-2 w-full">
                          {hasResponse && (
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-500" />
                          )}
                          <span className="flex-1 leading-tight break-words">
                            {index + 1}. {question.text}
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ChapterNavigation;
