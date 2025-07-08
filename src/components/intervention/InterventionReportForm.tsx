
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Mic, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInterventionForm } from './hooks/useInterventionForm';
import { BasicInfoSection } from './form-sections/BasicInfoSection';
import LastReportsSelector from './form-sections/LastReportsSelector';
import { ActivitiesSection } from './form-sections/ActivitiesSection';
import { PhysicalStateSection } from './form-sections/PhysicalStateSection';
import { MentalStateSection } from './form-sections/MentalStateSection';
import { HygieneSection } from './form-sections/HygieneSection';
import { NutritionSection } from './form-sections/NutritionSection';
import { FollowUpSection } from './form-sections/FollowUpSection';
import { MediaSection } from './form-sections/MediaSection';
import { ClientEvaluationSection } from './form-sections/ClientEvaluationSection';
import InterventionAudioRecorder from './InterventionAudioRecorder';
import { InterventionFormData } from './types/FormData';

const InterventionReportForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    formData,
    setFormData,
    loading,
    loadingData,
    handleSubmit,
    reportId,
    handleAudioRecorded,
    handleAudioUrlGenerated,
    isRecording,
    setIsRecording,
  } = useInterventionForm();

  const handleMediaChange = (mediaFiles: any[]) => {
    setFormData(prev => ({ ...prev, media_files: mediaFiles }));
  };

  const handleRemoveFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      media_files: (prev.media_files || []).filter((file: any) => file.id !== fileId)
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double protection contre la soumission pendant l'enregistrement
    if (isRecording) {
      console.log('🚫 FORM_COMPONENT - Soumission bloquée par protection du composant');
      return;
    }
    
    await handleSubmit(e);
  };

  const handleRecordingStateChange = (recordingState: boolean) => {
    console.log('🎤 FORM_COMPONENT - État enregistrement changé:', recordingState);
    setIsRecording(recordingState);
  };

  const handleReportCopy = (reportData: Partial<InterventionFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...reportData,
    }));
  };

  const handleBack = () => {
    const fromParam = searchParams.get('from');
    if (fromParam === 'caregivers') {
      navigate('/caregivers');
    } else {
      navigate('/professional-scheduler');
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              {reportId ? 'Modifier le rapport d\'intervention' : 'Nouveau rapport d\'intervention'}
              {isRecording && (
                <div className="flex items-center text-red-500">
                  <Mic className="w-4 h-4 animate-pulse mr-1" />
                  <span className="text-sm font-medium">Enregistrement...</span>
                </div>
              )}
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={handleBack} 
              className="w-full sm:w-auto" 
              disabled={isRecording || loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Alerte pendant l'enregistrement */}
          {isRecording && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Enregistrement audio en cours</p>
                  <p className="text-sm text-red-600">
                    Veuillez arrêter l'enregistrement avant de sauvegarder ou naviguer.
                    Toutes les actions sont temporairement désactivées.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-8">
            <BasicInfoSection 
              formData={formData} 
              setFormData={setFormData}
            />
            
            {/* Sélecteur de rapports précédents - uniquement si on a un nom de patient */}
            {formData.patient_name && !reportId && (
              <LastReportsSelector
                clientName={formData.patient_name}
                onReportSelected={handleReportCopy}
              />
            )}
            
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
            
            <FollowUpSection 
              formData={formData} 
              setFormData={setFormData}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Enregistrement audio</h3>
              <div className={isRecording ? "ring-2 ring-red-300 rounded-lg" : ""}>
                <InterventionAudioRecorder
                  onAudioRecorded={handleAudioRecorded}
                  onAudioUrlGenerated={handleAudioUrlGenerated}
                  existingAudioUrl={formData.audio_url}
                  reportId={reportId || undefined}
                  onRecordingStateChange={handleRecordingStateChange}
                />
              </div>
            </div>
            
            <MediaSection 
              mediaFiles={formData.media_files || []}
              onMediaChange={handleMediaChange}
              onRemoveFile={handleRemoveFile}
            />
            
            <ClientEvaluationSection 
              formData={formData} 
              setFormData={setFormData}
            />

            <div className="flex justify-end space-x-4">              
              <Button 
                type="submit" 
                disabled={loading || isRecording} 
                className={`flex items-center gap-2 ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="h-4 w-4" />
                {loading ? 'Sauvegarde...' : reportId ? 'Mettre à jour' : 'Créer le rapport'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterventionReportForm;
