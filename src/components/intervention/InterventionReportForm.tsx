
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInterventionForm } from './hooks/useInterventionForm';
import { BasicInfoSection } from './form-sections/BasicInfoSection';
import { ActivitiesSection } from './form-sections/ActivitiesSection';
import { PhysicalStateSection } from './form-sections/PhysicalStateSection';
import { MentalStateSection } from './form-sections/MentalStateSection';
import { HygieneSection } from './form-sections/HygieneSection';
import { NutritionSection } from './form-sections/NutritionSection';
import { FollowUpSection } from './form-sections/FollowUpSection';
import { MediaSection } from './form-sections/MediaSection';
import { ClientEvaluationSection } from './form-sections/ClientEvaluationSection';
import InterventionAudioRecorder from './InterventionAudioRecorder';

const InterventionReportForm: React.FC = () => {
  const navigate = useNavigate();
  const {
    formData,
    setFormData,
    loading,
    loadingData,
    handleSubmit,
    reportId,
    handleAudioRecorded,
    handleAudioUrlGenerated,
    isRecording, // NOUVEAU: Récupérer l'état d'enregistrement
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
              {/* NOUVEAU: Indicateur visuel pendant l'enregistrement */}
              {isRecording && (
                <div className="flex items-center text-red-500">
                  <Mic className="w-4 h-4 animate-pulse mr-1" />
                  <span className="text-sm">Enregistrement...</span>
                </div>
              )}
            </CardTitle>
            <Button variant="outline" onClick={() => navigate('/scheduler')} className="w-full sm:w-auto" disabled={isRecording}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
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
            
            <FollowUpSection 
              formData={formData} 
              setFormData={setFormData}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Enregistrement audio</h3>
              <InterventionAudioRecorder
                onAudioRecorded={handleAudioRecorded}
                onAudioUrlGenerated={handleAudioUrlGenerated}
                existingAudioUrl={formData.audio_url}
                reportId={reportId || undefined}
              />
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
              {/* NOUVEAU: Message d'avertissement pendant l'enregistrement */}
              {isRecording && (
                <div className="flex items-center text-amber-600 text-sm mr-4">
                  <Mic className="w-4 h-4 mr-1" />
                  Arrêtez l'enregistrement avant de sauvegarder
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={loading || isRecording} 
                className="flex items-center gap-2"
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
