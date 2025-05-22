
// src/components/life-story/LifeStoryLayout.tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Chapter } from '@/types/lifeStory';
import ChapterTabs from './ChapterTabs';

interface LifeStoryLayoutProps {
  chapters: Chapter[];
  activeTab: string;
  openQuestions: { [key: string]: boolean };
  activeQuestion: string | null;
  setActiveTab: (tab: string) => void;
  toggleQuestions: (chapterId: string) => void;
  handleQuestionFocus: (chapterId: string, questionId: string) => void;
  updateAnswer: (chapterId: string, questionId: string, answer: string) => void;
  onAudioRecorded: (chapterId: string, questionId: string, blob: Blob) => void;
  onAudioDeleted: (chapterId: string, questionId: string) => void;
}

const LifeStoryLayout: React.FC<LifeStoryLayoutProps> = ({
  chapters,
  activeTab,
  openQuestions,
  activeQuestion,
  setActiveTab,
  toggleQuestions,
  handleQuestionFocus,
  updateAnswer,
  onAudioRecorded,
  onAudioDeleted,
}) => {
  const [recording, setRecording] = useState<string | null>(null); // ID de la question en cours d'enregistrement
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async (chapterId: string, questionId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log("Blob créé:", blob, "Taille:", blob.size); // Débogage
        onAudioRecorded(chapterId, questionId, blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.start();
      setRecording(questionId);
      toast.success("Enregistrement démarré");
    } catch (err) {
      console.error("Erreur d'accès au microphone:", err);
      toast.error("Erreur d'accès au microphone. Vérifiez les permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Utiliser le composant ChapterTabs pour afficher les onglets et le contenu */}
      <ChapterTabs
        chapters={chapters}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        updateAnswer={updateAnswer}
        handleQuestionFocus={(questionId) => handleQuestionFocus(activeTab, questionId)}
        activeQuestion={activeQuestion}
        onAudioRecorded={(chapterId, questionId, audioBlob, audioUrl) => {
          const blob = new Blob([audioBlob], { type: 'audio/webm' });
          onAudioRecorded(chapterId, questionId, blob);
        }}
        onAudioDeleted={onAudioDeleted}
      />
    </div>
  );
};

export default LifeStoryLayout;
