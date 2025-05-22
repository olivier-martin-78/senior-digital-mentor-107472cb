// src/components/life-story/VoiceAnswerRecorder.tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

interface VoiceAnswerRecorderProps {
  questionId: string;
  chapterId: string;
  existingAudio: string | null | undefined;
  onRecordingComplete: (blob: Blob) => void;
  onDeleteRecording: () => void;
}

const VoiceAnswerRecorder: React.FC<VoiceAnswerRecorderProps> = ({
  questionId,
  chapterId,
  existingAudio,
  onRecordingComplete,
  onDeleteRecording,
}) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('Données audio reçues:', e.data.size);
        } else {
          console.log('Aucune donnée audio reçue');
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('MediaRecorder arrêté, création du Blob');
        if (chunksRef.current.length === 0) {
          console.error('Aucun chunk audio collecté');
          toast.error('Aucun audio enregistré. Veuillez réessayer.');
          return;
        }
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('Blob créé:', blob, 'Taille:', blob.size, 'Type:', blob.type);
        if (blob.size === 0) {
          console.error('Blob vide créé');
          toast.error('L’enregistrement est vide. Veuillez réessayer.');
          return;
        }
        onRecordingComplete(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setRecording(false);
        chunksRef.current = [];
      };

      mediaRecorderRef.current.onerror = (e) => {
        console.error('Erreur MediaRecorder:', e);
        toast.error('Erreur lors de l’enregistrement audio.');
        setRecording(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.start(1000); // Collecter les données toutes les secondes
      setRecording(true);
      console.log('Enregistrement démarré pour:', { chapterId, questionId });
      toast.success('Enregistrement démarré');
    } catch (err) {
      console.error('Erreur d’accès au microphone:', err);
      toast.error('Erreur d’accès au microphone. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('Arrêt de l’enregistrement pour:', { chapterId, questionId });
      mediaRecorderRef.current.stop();
      // setRecording(false) est géré dans onstop
    } else {
      console.log('MediaRecorder déjà arrêté ou non initialisé');
      setRecording(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <Button
        onClick={recording ? stopRecording : startRecording}
        className="bg-tranches-sage hover:bg-tranches-sage/90"
        disabled={recording && !mediaRecorderRef.current}
      >
        {recording ? 'Arrêter' : 'Enregistrer'}
      </Button>
      {existingAudio && (
        <>
          <audio
            controls
            src={existingAudio}
            className="w-full max-w-md"
            onError={e => console.error('Erreur de lecture audio:', e)}
          />
          <Button
            variant="outline"
            onClick={() => {
              console.log('Suppression audio pour:', { chapterId, questionId });
              onDeleteRecording();
            }}
          >
            Supprimer l’audio
          </Button>
        </>
      )}
      <div className="text-sm text-gray-500">
        Debug: audioUrl = {existingAudio || 'null'}
      </div>
    </div>
  );
};

export default VoiceAnswerRecorder;
