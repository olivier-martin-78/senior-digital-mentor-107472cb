
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import QuestionItem from './QuestionItem';
import { Chapter } from '@/types/lifeStory';

interface ChapterContentProps {
  chapter: Chapter;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  activeQuestion: string | null;
  isReadOnly: boolean;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
  onAudioUrlChange?: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
}

export const ChapterContent: React.FC<ChapterContentProps> = ({
  chapter,
  updateAnswer,
  handleQuestionFocus,
  activeQuestion,
  isReadOnly,
  onAudioRecorded,
  onAudioDeleted,
  onAudioUrlChange,
}) => {
  console.log('📄 ChapterContent - Rendu pour chapitre:', {
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    isReadOnly,
    questionsCount: chapter.questions?.length || 0
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chapter.title}</CardTitle>
        <CardDescription>
          {chapter.description}
          {isReadOnly && (
            <div className="mt-2 text-sm text-blue-600">
              <span className="font-medium">[Mode lecture seule]</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {chapter.questions && chapter.questions.length > 0 ? (
          chapter.questions.map(question => (
            <QuestionItem 
              key={question.id}
              question={question}
              chapterId={chapter.id}
              onAnswerChange={updateAnswer}
              onQuestionFocus={handleQuestionFocus}
              activeQuestion={activeQuestion}
              isReadOnly={isReadOnly}
              onAudioRecorded={onAudioRecorded}
              onAudioDeleted={onAudioDeleted}
              onAudioUrlChange={onAudioUrlChange}
            />
          ))
        ) : (
          <p className="text-gray-600">Aucune question disponible pour ce chapitre.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ChapterContent;
