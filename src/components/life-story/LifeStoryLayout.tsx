// src/components/life-story/LifeStoryLayout.tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Chapter } from '@/types/lifeStory';

interface LifeStoryLayoutProps {
  chapters: Chapter[];
  activeTab: string;
  openQuestions: { [key: string]: boolean };
  activeQuestion: string | null;
  setActiveTab: (tab: string) => void;
  toggleQuestions: (chapterId: string) => void;
  handleQuestionFocus: (questionId: string) => void;
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
        console.log('Blob créé:', blob, 'Taille:', blob.size); // Débogage
        onAudioRecorded(chapterId, questionId, blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.start();
      setRecording(questionId);
      toast.success('Enregistrement démarré');
    } catch (err) {
      console.error('Erreur d’accès au microphone:', err);
      toast.error('Erreur d’accès au microphone. Vérifiez les permissions.');
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
      {/* Navigation entre les chapitres */}
      <div className="flex space-x-4">
        {chapters.map(chapter => (
          <Button
            key={chapter.id}
            variant={activeTab === chapter.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(chapter.id)}
          >
            {chapter.title}
          </Button>
        ))}
      </div>

      {/* Questions du chapitre actif */}
      {chapters
        .filter(chapter => chapter.id === activeTab)
        .map(chapter => (
          <div key={chapter.id}>
            <Button
              variant="ghost"
              onClick={() => toggleQuestions(chapter.id)}
            >
              {openQuestions[chapter.id] ? 'Masquer les questions' : 'Afficher les questions'}
            </Button>
            {openQuestions[chapter.id] && chapter.questions && (
              <div className="mt-4 space-y-4">
                {chapter.questions.map(question => (
                  <div key={question.id} className="border p-4 rounded-lg">
                    <h3 className="text-lg font-medium">{question.text}</h3>
                    <textarea
                      className="w-full mt-2 p-2 border rounded"
                      value={question.answer || ''}
                      onChange={e => updateAnswer(chapter.id, question.id, e.target.value)}
                      onFocus={() => handleQuestionFocus(question.id)}
                    />
                    <div className="mt-2 flex space-x-4">
                      <Button
                        onClick={() =>
                          recording === question.id
                            ? stopRecording()
                            : startRecording(chapter.id, question.id)
                        }
                        className="bg-tranches-sage hover:bg-tranches-sage/90"
                        disabled={recording && recording !== question.id}
                      >
                        {recording === question.id ? 'Arrêter' : 'Enregistrer'}
                      </Button>
                      {question.audioUrl && (
                        <>
                          <audio controls src={question.audioUrl} className="w-full max-w-md" />
                          <Button
                            variant="outline"
                            onClick={() => onAudioDeleted(chapter.id, question.id)}
                          >
                            Supprimer l’audio
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

export default LifeStoryLayout;
