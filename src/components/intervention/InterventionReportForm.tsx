
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { AppointmentSelector } from './components/AppointmentSelector';
import VoiceRecorderForIntervention from './VoiceRecorderForIntervention';
import { Slider } from "@/components/ui/slider"
import { BasicInfoSection } from './form-sections/BasicInfoSection';
import { ActivitiesSection } from './form-sections/ActivitiesSection';
import { PhysicalStateSection } from './form-sections/PhysicalStateSection';
import { MentalStateSection } from './form-sections/MentalStateSection';
import { HygieneSection } from './form-sections/HygieneSection';
import { NutritionSection } from './form-sections/NutritionSection';
import { FollowUpSection } from './form-sections/FollowUpSection';
import { MediaSection } from './form-sections/MediaSection';
import { ClientEvaluationSection } from './form-sections/ClientEvaluationSection';
import { useInterventionForm } from './hooks/useInterventionForm';

const InterventionReportForm = () => {
  const {
    formData,
    setFormData,
    selectedAppointment,
    loading,
    loadingData,
    reportId,
    handleAppointmentChange,
    handleSubmit,
  } = useInterventionForm();

  // Fonction pour gérer les changements de médias
  const handleMediaChange = (mediaFiles: any[]) => {
    setFormData(prev => ({ ...prev, media_files: mediaFiles }));
  };

  const handleRemoveMediaFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      media_files: prev.media_files.filter(file => file.id !== fileId)
    }));
  };

  // Fonction pour gérer les changements d'audio
  const handleAudioChange = (blob: Blob | null) => {
    console.log('🎯 AUDIO_CHANGE - Changement d\'audio:', {
      hasBlob: !!blob,
      blobSize: blob?.size || 0,
      currentAudioUrl: formData.audio_url
    });
    
    // Si pas de blob, effacer l'URL audio
    if (!blob) {
      console.log('🎯 AUDIO_CHANGE - Suppression de l\'URL audio');
      setFormData(prev => ({ ...prev, audio_url: '' }));
    }
  };

  // Fonction pour gérer les changements d'URL audio
  const handleAudioUrlChange = (url: string | null) => {
    console.log('🎯 AUDIO_URL_CHANGE - Changement d\'URL audio:', {
      newUrl: url,
      urlType: typeof url,
      urlLength: url?.length || 0,
      previousUrl: formData.audio_url
    });
    
    setFormData(prev => ({ ...prev, audio_url: url || '' }));
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {reportId ? 'Modifier le rapport d\'intervention' : 'Nouveau rapport d\'intervention'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <ActivitiesSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <PhysicalStateSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <MentalStateSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <HygieneSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <NutritionSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <div>
            <Label htmlFor="observations">Observations générales</Label>
            <Textarea
              id="observations"
              placeholder="Ajoutez des observations générales"
              value={formData.observations || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
            />
          </div>

          <FollowUpSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <div>
            <Label htmlFor="appointment">Rendez-vous</Label>
            <AppointmentSelector
              selectedAppointment={selectedAppointment}
              selectedAppointmentId={formData.appointment_id}
              onAppointmentChange={handleAppointmentChange}
            />
          </div>

          <ClientEvaluationSection 
            formData={formData} 
            setFormData={setFormData}
          />

          <MediaSection 
            mediaFiles={formData.media_files}
            onMediaChange={handleMediaChange}
            onRemoveFile={handleRemoveMediaFile}
          />
          
          {/* Section audio */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Enregistrement vocal</Label>
            <VoiceRecorderForIntervention
              onAudioChange={handleAudioChange}
              onAudioUrlChange={handleAudioUrlChange}
              reportId={reportId}
              existingAudioUrl={formData.audio_url}
              disabled={loading}
            />
          </div>

          <Button disabled={loading} className="w-full">
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InterventionReportForm;
