
import { useState } from 'react';
import { useInterventionData } from './useInterventionData';
import { useInterventionAudio } from './useInterventionAudio';
import { useInterventionSubmit } from './useInterventionSubmit';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';

export const useInterventionForm = () => {
  const [loading, setLoading] = useState(false);
  
  // Surveiller l'état d'enregistrement pour empêcher la soumission
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
    console.log('🎤 FORM - Audio enregistré, taille:', blob.size);
    baseHandleAudioRecorded(blob, setFormData);
  };

  const handleAudioUrlGenerated = (url: string) => {
    console.log('🎵 FORM - URL audio générée:', url);
    baseHandleAudioUrlGenerated(url, setFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('📝 FORM - Tentative de soumission, isRecording:', isRecording);
    
    // CRITIQUE: Bloquer absolument si on enregistre
    if (isRecording) {
      console.log('🚫 FORM - Soumission bloquée - enregistrement en cours');
      e.preventDefault();
      return false;
    }
    
    const result = await baseHandleSubmit(
      e,
      formData,
      reportId,
      (reportId: string) => uploadAudioIfNeeded(reportId, formData.audio_url),
      setLoading,
      isRecording // Passer l'état d'enregistrement
    );
    
    return result;
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
    isRecording, // Exposer l'état d'enregistrement
  };
};
