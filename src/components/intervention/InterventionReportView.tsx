
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import InterventionNotificationButton from './InterventionNotificationButton';
import { AudioDiagnosticTool } from './AudioDiagnosticTool';
import { ReportHeader } from './view/ReportHeader';
import { GeneralInfoSection } from './view/GeneralInfoSection';
import { AppointmentInfoSection } from './view/AppointmentInfoSection';
import { ReportSection } from './view/ReportSection';
import { MediaSection } from './view/MediaSection';
import { AudioSection } from './view/AudioSection';
import { ClientEvaluationSection } from './view/ClientEvaluationSection';
import { useReportData } from './view/hooks/useReportData';
import { useReportActions } from './view/hooks/useReportActions';

const InterventionReportView = () => {
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report_id');
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const { loading, report, appointment, audioStatus, setAudioStatus } = useReportData(reportId);
  const { deleting, handleEdit, handleDelete, handleExportAudio, handleBack } = useReportActions(reportId, report);

  console.log('🔍 InterventionReportView - Début du rendu:', {
    reportId,
    loading,
    hasReport: !!report,
    audioStatus
  });

  // Show diagnostic tool when audio issues are detected
  React.useEffect(() => {
    if (audioStatus === 'expired' || audioStatus === 'none') {
      setShowDiagnostic(true);
    }
  }, [audioStatus]);

  if (loading) {
    console.log('⏳ Affichage état de chargement');
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!reportId) {
    console.log('❌ Aucun ID de rapport fourni');
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Aucun rapport spécifié</p>
        <Button variant="outline" onClick={handleBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  if (!report) {
    console.log('❌ Rapport non trouvé');
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Rapport introuvable</p>
        <Button variant="outline" onClick={handleBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  console.log('✅ Rendu final du rapport avec audioStatus:', {
    audioStatus,
    hasAudioUrl: !!report.audio_url,
    audioUrl: report.audio_url,
    willShowPlayer: audioStatus === 'valid' && report.audio_url,
    showDiagnostic
  });

  return (
    <div className="space-y-6">
      <Card className="max-w-4xl mx-auto">
        <ReportHeader
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleting={deleting}
        />
        <CardContent className="space-y-6">
          {/* Bouton de notification des proches aidants */}
          <div className="flex justify-end">
            <InterventionNotificationButton
              reportId={reportId}
              title={`Rapport d'intervention - ${report.patient_name}`}
              alreadySent={report.email_notification_sent}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GeneralInfoSection report={report} />
            <AppointmentInfoSection appointment={appointment} />
          </div>

          <ReportSection
            title="Activités réalisées"
            data={report.activities}
            otherData={report.activities_other}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReportSection
              title="État physique"
              data={report.physical_state}
              otherData={report.physical_state_other}
              detailsData={report.pain_location ? `Douleur : ${report.pain_location}` : undefined}
            />
            <ReportSection
              title="État mental"
              data={report.mental_state}
              detailsData={report.mental_state_change ? `Changements : ${report.mental_state_change}` : undefined}
            />
          </div>

          <ReportSection
            title="Hygiène"
            data={report.hygiene}
            comments={report.hygiene_comments}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReportSection
              title="Appétit"
              data={report.appetite}
              comments={report.appetite_comments}
            />
            <ReportSection
              title="Hydratation"
              data={report.hydration}
            />
          </div>

          {report.observations && (
            <ReportSection
              title="Observations générales"
              data={report.observations}
            />
          )}

          <ReportSection
            title="Suivi nécessaire"
            data={report.follow_up}
            otherData={report.follow_up_other}
          />

          <MediaSection mediaFiles={report.media_files} />

          <AudioSection
            audioStatus={audioStatus}
            audioUrl={report.audio_url}
            onExportAudio={handleExportAudio}
            onEdit={handleEdit}
          />

          <ClientEvaluationSection
            clientRating={report.client_rating}
            clientComments={report.client_comments}
          />
        </CardContent>
      </Card>

      {/* Outil de diagnostic audio */}
      {showDiagnostic && reportId && (
        <div className="max-w-4xl mx-auto">
          <AudioDiagnosticTool
            reportId={reportId}
            currentAudioUrl={report?.audio_url}
            onAudioStatusChange={setAudioStatus}
          />
        </div>
      )}
    </div>
  );
};

export default InterventionReportView;
