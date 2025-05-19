
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import QuestionItem from './QuestionItem';
import { Chapter } from '@/types/lifeStory';

interface ChapterContentProps {
  chapter: Chapter;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  showVoiceRecorder: string | null;
  handleVoiceRecorder: (questionId: string) => void;
  activeQuestion: string | null;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null) => void;
}

export const ChapterContent: React.FC<ChapterContentProps> = ({
  chapter,
  updateAnswer,
  handleQuestionFocus,
  showVoiceRecorder,
  handleVoiceRecorder,
  activeQuestion,
  onAudioUrlChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{chapter.title}</CardTitle>
        <CardDescription>{chapter.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {chapter.questions.map(question => (
          <QuestionItem 
            key={question.id}
            question={question}
            chapterId={chapter.id}
            onAnswerChange={updateAnswer}
            onQuestionFocus={handleQuestionFocus}
            showVoiceRecorder={showVoiceRecorder}
            onToggleVoiceRecorder={handleVoiceRecorder}
            activeQuestion={activeQuestion}
            onAudioUrlChange={onAudioUrlChange}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default ChapterContent;
