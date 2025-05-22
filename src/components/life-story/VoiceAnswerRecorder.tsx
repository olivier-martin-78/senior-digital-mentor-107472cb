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
      const options = { mimeType: 'audio/mp4' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('Données audio reçues:', { size: e.data.size, type: e.data.type });
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
        const blob = new Blob(chunksRef.current, { type: 'audio/mp4' });
        console.log('Blob créé:', { blob, size: blob.size, type: blob.type });
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

      mediaRecorderRef.current.start(1000);
      setRecording(true);
      console.log('Enregistrement démarré pour:', { chapterId, questionId, mimeType: mediaRecorderRef.current.mimeType });
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
    } else {
      console.log('MediaRecorder déjà arrêté ou non initialisé');
      setRecording(false);
    }
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error('Erreur de lecture audio:', {
      error: e,
      src: existingAudio,
      userAgent: navigator.userAgent,
    });
    toast.error('Impossible de lire l’audio. Essayez un autre appareil ou re-enregistrez.');
  };

  const handleExport = async () => {
    if (!existingAudio) {
      console.error('Aucune URL audio disponible pour l’export:', { chapterId, questionId });
      toast.error('Aucun audio à exporter.');
      return;
    }

    try {
      console.log('Début de l’export audio:', { chapterId, questionId, audioUrl: existingAudio });
      const response = await fetch(existingAudio);
      if (!response.ok) {
        throw new Error(`Échec de la récupération du fichier audio: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('Fichier audio récupéré:', { size: blob.size, type: blob.type });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `question-${questionId}-${timestamp}.m4a`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Export réussi:', { fileName, chapterId, questionId });
      toast.success(`Audio exporté: ${fileName}`);
    } catch (err) {
      console.error('Erreur lors de l’export audio:', err);
      toast.error('Erreur lors de l’export de l’audio. Vérifiez votre connexion.');
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
            onError={handleAudioError}
            preload="metadata"
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
          <Button
            variant="outline"
            onClick={handleExport}
          >
            Exporter
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
