
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mic } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import AudioRecorder from './AudioRecorder';
import { Question } from '@/types/lifeStory';

interface QuestionItemProps {
  question: Question;
  chapterId: string;
  onAnswerChange: (chapterId: string, questionId: string, answer: string) => void;
  onQuestionFocus: (chapterId: string, questionId: string) => void;
  showVoiceRecorder: string | null;
  onToggleVoiceRecorder: (questionId: string) => void;
  activeQuestion: string | null;
  onAudioUrlChange: (chapterId: string, questionId: string, audioUrl: string | null) => void;
}

export const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  chapterId,
  onAnswerChange,
  onQuestionFocus,
  showVoiceRecorder,
  onToggleVoiceRecorder,
  activeQuestion,
  onAudioUrlChange
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
        
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onQuestionFocus(chapterId, question.id);
              onToggleVoiceRecorder(question.id);
            }}
          >
            <Mic className="w-4 h-4 mr-2" />
            {showVoiceRecorder === question.id 
              ? 'Cacher l\'enregistrement' 
              : 'Répondre par la voix'}
          </Button>
        </div>
        
        {/* Afficher l'audio existant */}
        {question.audioUrl && (
          <AudioPlayer 
            audioUrl={question.audioUrl}
            chapterId={chapterId}
            questionId={question.id}
            onDeleteSuccess={() => onAudioUrlChange(chapterId, question.id, null)}
          />
        )}
        
        {/* Afficher l'enregistreur vocal */}
        {showVoiceRecorder === question.id && (
          <AudioRecorder 
            chapterId={chapterId}
            questionId={question.id}
            onAudioUrlChange={onAudioUrlChange}
          />
        )}
      </div>
      
      <Separator className="my-4" />
    </div>
  );
};

export default QuestionItem;
