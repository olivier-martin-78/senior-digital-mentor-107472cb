
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
  isReadOnly: boolean;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
  onAudioUrlChange?: (chapterId: string, questionId: string, audioUrl: string | null, preventAutoSave?: boolean) => void;
}

export const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  chapterId,
  onAnswerChange,
  onQuestionFocus,
  activeQuestion,
  isReadOnly,
  onAudioRecorded,
  onAudioDeleted,
  onAudioUrlChange,
}) => {
  // Log uniquement pour la question 1 du chapitre 1
  const shouldLog = chapterId === 'chapter-1' && question.id === 'question-1';
  
  if (shouldLog) {
    console.log('📝 QuestionItem - Question avec contenu:', { 
      questionId: question.id, 
      answer: question.answer,
      answerLength: question.answer?.length,
      audioUrl: question.audioUrl,
      hasAudioUrl: !!question.audioUrl,
      audioUrlLength: question.audioUrl?.length,
      audioUrlPreview: question.audioUrl?.substring(0, 100) + '...',
      isReadOnly
    });
  }

  console.log('❓ QuestionItem - Rendu pour question:', {
    chapterId,
    questionId: question.id,
    isReadOnly,
    hasAnswer: !!question.answer,
    hasAudioUrl: !!question.audioUrl
  });

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-tranches-charcoal">{question.text}</h3>
      
      <div className="space-y-4">
        <Textarea
          placeholder={isReadOnly ? "Aucune réponse" : "Votre réponse..."}
          value={question.answer || ''}
          onChange={(e) => onAnswerChange(chapterId, question.id, e.target.value)}
          onFocus={() => onQuestionFocus(chapterId, question.id)}
          className="min-h-[120px]"
          readOnly={isReadOnly}
          disabled={isReadOnly}
        />
        
        <VoiceAnswerRecorder
          questionId={question.id}
          chapterId={chapterId}
          existingAudioUrl={question.audioUrl}
          onAudioRecorded={onAudioRecorded}
          onAudioDeleted={onAudioDeleted}
          onAudioUrlChange={onAudioUrlChange}
          shouldLog={shouldLog}
        />
      </div>
      
      <Separator className="my-4" />
    </div>
  );
};

export default QuestionItem;
