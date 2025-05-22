// src/components/life-story/QuestionItem.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Question } from '@/types/lifeStory';
import VoiceAnswerRecorder from './VoiceAnswerRecorder';

interface QuestionItemProps {
  question: Question;
  chapterId: string;
  onAnswerChange: (chapterId: string, questionId: string, answer: string) => void;
  onQuestionFocus: (chapterId: string, questionId: string) => void;
  activeQuestion: string | null;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
}

export const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  chapterId,
  onAnswerChange,
  onQuestionFocus,
  activeQuestion,
  onAudioRecorded,
  onAudioDeleted,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-tranches-charcoal">{question.text}</h3>
      
      <div className="space-y-4">
        <Textarea
          placeholder="Votre réponse..."
          value={question.answer || ''}
          onChange={(e) => onAnswerChange(chapterId, question.id, e.target.value)}
          onFocus={() => onQuestionFocus(chapterId, question.id)}
          className="min-h-[120px]"
        />
        
        <VoiceAnswerRecorder
          questionId={question.id}
          chapterId={chapterId}
          existingAudio={question.audioUrl}
          onRecordingComplete={(blob) => onAudioRecorded(chapterId, question.id, blob)}
          onDeleteRecording={() => onAudioDeleted(chapterId, question.id)}
        />
      </div>
      
      <Separator className="my-4" />
    </div>
  );
};

export default QuestionItem;
