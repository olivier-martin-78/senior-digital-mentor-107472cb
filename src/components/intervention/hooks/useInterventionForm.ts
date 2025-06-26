
import { useState } from 'react';
import { useInterventionData } from './useInterventionData';
import { useInterventionAudio } from './useInterventionAudio';
import { useInterventionSubmit } from './useInterventionSubmit';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';

export const useInterventionForm = () => {
  const [loading, setLoading] = useState(false);
  
  // Ajouter le hook d'enregistrement vocal pour surveiller l'état
  const { isRecording } = useVoiceRecorder();
  
  const {
    formData,
    setFormData,
    clients,
    appointments,
    allIntervenants,
    selectedAppointment,
    setSelectedAppointment,
    loadingData,
    showAppointmentSelector,
    setShowAppointmentSelector,
    reportId,
    handleAppointmentChange,
  } = useInterventionData();

  const {
    audioBlob,
    isUploadingAudio,
    handleAudioRecorded: baseHandleAudioRecorded,
    handleAudioUrlGenerated: baseHandleAudioUrlGenerated,
    uploadAudioIfNeeded,
  } = useInterventionAudio();

  const { handleSubmit: baseHandleSubmit } = useInterventionSubmit();

  // Wrapper functions to pass setFormData
  const handleAudioRecorded = (blob: Blob) => {
    baseHandleAudioRecorded(blob, setFormData);
  };

  const handleAudioUrlGenerated = (url: string) => {
    baseHandleAudioUrlGenerated(url, setFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    return baseHandleSubmit(
      e,
      formData,
      reportId,
      (reportId: string) => uploadAudioIfNeeded(reportId, formData.audio_url),
      setLoading,
      isRecording // NOUVEAU: Passer l'état d'enregistrement
    );
  };

  return {
    formData,
    setFormData,
    clients,
    appointments,
    allIntervenants,
    selectedAppointment,
    setSelectedAppointment,
    loading: loading || isUploadingAudio,
    loadingData,
    showAppointmentSelector,
    setShowAppointmentSelector,
    reportId,
    handleAppointmentChange,
    handleSubmit,
    handleAudioRecorded,
    handleAudioUrlGenerated,
    isRecording, // NOUVEAU: Exposer l'état d'enregistrement
  };
};
