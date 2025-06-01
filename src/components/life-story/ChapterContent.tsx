
// src/components/life-story/ChapterContent.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import QuestionItem from './QuestionItem';
import { Chapter } from '@/types/lifeStory';
import { useAuth } from '@/contexts/AuthContext';

interface ChapterContentProps {
  chapter: Chapter;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  activeQuestion: string | null;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
  onAudioUrlChange?: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
}

export const ChapterContent: React.FC<ChapterContentProps> = ({
  chapter,
  updateAnswer,
  handleQuestionFocus,
  activeQuestion,
  onAudioRecorded,
  onAudioDeleted,
  onAudioUrlChange,
}) => {
  const { profile, hasRole } = useAuth();
  const isReader = hasRole('reader');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chapter.title}</CardTitle>
        <CardDescription>
          {chapter.description}
          {profile && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Auteur :</span> {profile.display_name || profile.email}
              {isReader && (
                <span className="ml-3 text-blue-600 font-medium">[Mode lecture seule]</span>
              )}
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
