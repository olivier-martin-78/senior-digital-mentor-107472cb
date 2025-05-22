// src/components/life-story/ChapterContent.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import QuestionItem from './QuestionItem';
import { Chapter } from '@/types/lifeStory';

interface ChapterContentProps {
  chapter: Chapter;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  activeQuestion: string | null;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
}

export const ChapterContent: React.FC<ChapterContentProps> = ({
  chapter,
  updateAnswer,
  handleQuestionFocus,
  activeQuestion,
  onAudioRecorded,
  onAudioDeleted,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{chapter.title}</CardTitle>
        <CardDescription>{chapter.description}</CardDescription>
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
              onAudioRecorded={onAudioRecorded}
              onAudioDeleted={onAudioDeleted}
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
