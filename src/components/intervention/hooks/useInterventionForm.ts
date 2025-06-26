
import { useState } from 'react';
import { useInterventionData } from './useInterventionData';
import { useInterventionAudio } from './useInterventionAudio';
import { useInterventionSubmit } from './useInterventionSubmit';

export const useInterventionForm = () => {
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
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

  // Wrapper functions to pass setFormData and track recording state
  const handleAudioRecorded = (blob: Blob) => {
    console.log('🎤 FORM_HOOK - Audio enregistré, taille:', blob.size);
    baseHandleAudioRecorded(blob, setFormData);
  };

  const handleAudioUrlGenerated = (url: string) => {
    console.log('🎵 FORM_HOOK - URL audio générée:', url);
    baseHandleAudioUrlGenerated(url, setFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('📝 FORM_HOOK - Tentative de soumission, isRecording:', isRecording);
    
    // CRITIQUE: Bloquer absolument si on enregistre
    if (isRecording) {
      console.log('🚫 FORM_HOOK - Soumission bloquée - enregistrement en cours');
      e.preventDefault();
      return false;
    }
    
    const result = await baseHandleSubmit(
      e,
      formData,
      reportId,
      (reportId: string) => uploadAudioIfNeeded(reportId, formData.audio_url),
      setLoading,
      isRecording
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
    isRecording,
    setIsRecording, // Exposer pour que les composants audio puissent mettre à jour l'état
  };
};
