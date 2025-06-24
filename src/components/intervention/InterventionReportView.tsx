import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Trash2, ArrowLeft, Calendar, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Appointment, Client, Intervenant } from '@/types/appointments';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';
import { validateAndCleanAudioUrl, isExpiredBlobUrl } from '@/utils/audioUrlCleanup';

const InterventionReportView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report_id');

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [audioStatus, setAudioStatus] = useState<'loading' | 'valid' | 'expired' | 'none'>('none');

  console.log('🔍 InterventionReportView - Début du rendu:', {
    reportId,
    loading,
    hasReport: !!report,
    userId: user?.id,
    audioStatus
  });

  useEffect(() => {
    if (reportId && user) {
      loadReport();
    } else {
      console.log('❌ Paramètres manquants:', { reportId, hasUser: !!user });
      setLoading(false);
    }
  }, [reportId, user]);

  const loadReport = async () => {
    if (!reportId || !user) {
      console.log('❌ Paramètres manquants pour charger le rapport');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📋 Chargement du rapport:', reportId);
      
      // Charger le rapport
      const { data: reportData, error: reportError } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) {
        console.error('❌ Erreur lors du chargement du rapport:', reportError);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le rapport d\'intervention',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('✅ Rapport chargé:', {
        reportId: reportData?.id,
        hasAudioUrl: !!reportData?.audio_url,
        audioUrl: reportData?.audio_url,
        audioUrlLength: reportData?.audio_url?.length || 0,
        appointmentId: reportData?.appointment_id
      });

      // Analyser l'état de l'audio avec plus de détails
      if (!reportData?.audio_url || reportData.audio_url.trim() === '') {
        console.log('🎵 Aucune URL audio dans le rapport (vide ou null)');
        setAudioStatus('none');
      } else if (isExpiredBlobUrl(reportData.audio_url)) {
        console.log('🎵 URL audio expirée détectée:', reportData.audio_url);
        setAudioStatus('expired');
        // Nettoyer l'URL expirée
        const validatedAudioUrl = await validateAndCleanAudioUrl(reportData.audio_url, reportId);
        reportData.audio_url = validatedAudioUrl;
        if (!validatedAudioUrl) {
          setAudioStatus('expired');
        }
      } else {
        console.log('🎵 URL audio détectée, validation en cours:', reportData.audio_url);
        setAudioStatus('loading');
        
        // Vérifier si l'URL est accessible
        try {
          const response = await fetch(reportData.audio_url, { method: 'HEAD' });
          if (response.ok) {
            console.log('🎵 URL audio valide et accessible');
            setAudioStatus('valid');
          } else {
            console.log('🎵 URL audio non accessible, status:', response.status);
            setAudioStatus('expired');
          }
        } catch (error) {
          console.log('🎵 Erreur lors de la vérification de l\'URL audio:', error);
          setAudioStatus('expired');
        }
      }

      setReport(reportData);

      // Si le rapport a un appointment_id, charger le rendez-vous associé
      if (reportData?.appointment_id) {
        console.log('📅 Chargement du rendez-vous:', reportData.appointment_id);
        
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select(`
            *,
            clients:client_id (
              first_name,
              last_name,
              address
            ),
            intervenants:intervenant_id (
              first_name,
              last_name
            )
          `)
          .eq('id', reportData.appointment_id)
          .single();

        if (appointmentData && !appointmentError) {
          console.log('✅ Rendez-vous chargé');
          setAppointment(appointmentData);
        } else {
          console.log('⚠️ Erreur lors du chargement du rendez-vous:', appointmentError);
        }
      }
    } catch (error) {
      console.error('💥 Erreur inattendue:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/intervention-report?report_id=${reportId}&edit=true`);
  };

  const handleDelete = async () => {
    if (!reportId || !user) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('intervention_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      if (report?.appointment_id) {
        await supabase
          .from('appointments')
          .update({ 
            intervention_report_id: null,
            status: 'scheduled'
          })
          .eq('id', report.appointment_id);
      }

      toast({
        title: 'Succès',
        description: 'Rapport supprimé avec succès',
      });

      navigate('/scheduler');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le rapport',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatArrayToText = (array: string[] = []) => {
    return array.length > 0 ? array.join(', ') : 'Aucun';
  };

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
        <Button variant="outline" onClick={() => navigate('/scheduler')} className="mt-4">
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
        <Button variant="outline" onClick={() => navigate('/scheduler')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  console.log('✅ Rendu du rapport complet avec audioStatus:', audioStatus);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport d'intervention
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate('/scheduler')} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleEdit} className="w-full sm:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer le rapport</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer ce rapport d'intervention ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations générales
            </h3>
            <div className="bg-gray-50 p-3 rounded-md space-y-1">
              <p><strong>Patient :</strong> {report.patient_name}</p>
              <p><strong>Auxiliaire :</strong> {report.auxiliary_name}</p>
              <p><strong>Date :</strong> {new Date(report.date).toLocaleDateString()}</p>
              {report.start_time && report.end_time && (
                <p><strong>Horaires :</strong> {report.start_time} - {report.end_time}</p>
              )}
              {report.hourly_rate && (
                <p><strong>Taux horaire :</strong> {report.hourly_rate}€</p>
              )}
            </div>
          </div>

          {appointment && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Rendez-vous associé
              </h3>
              <div className="bg-gray-50 p-3 rounded-md space-y-1">
                <p><strong>Client :</strong> {appointment.clients?.first_name} {appointment.clients?.last_name}</p>
                {appointment.clients?.address && (
                  <p><strong>Adresse :</strong> {appointment.clients.address}</p>
                )}
                <p><strong>Intervenant :</strong> {appointment.intervenants?.first_name} {appointment.intervenants?.last_name}</p>
                <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                  {appointment.status === 'completed' ? 'Terminé' : 'Programmé'}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Activités réalisées</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <p>{formatArrayToText(report.activities)}</p>
            {report.activities_other && (
              <p className="mt-2"><strong>Autres :</strong> {report.activities_other}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">État physique</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <p>{formatArrayToText(report.physical_state)}</p>
              {report.physical_state_other && (
                <p className="mt-2"><strong>Détails :</strong> {report.physical_state_other}</p>
              )}
              {report.pain_location && (
                <p className="mt-2"><strong>Douleur :</strong> {report.pain_location}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">État mental</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <p>{formatArrayToText(report.mental_state)}</p>
              {report.mental_state_change && (
                <p className="mt-2"><strong>Changements :</strong> {report.mental_state_change}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Hygiène</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <p>{formatArrayToText(report.hygiene)}</p>
            {report.hygiene_comments && (
              <p className="mt-2"><strong>Commentaires :</strong> {report.hygiene_comments}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Appétit</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <p>{report.appetite || 'Non renseigné'}</p>
              {report.appetite_comments && (
                <p className="mt-2"><strong>Commentaires :</strong> {report.appetite_comments}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Hydratation</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <p>{report.hydration || 'Non renseigné'}</p>
            </div>
          </div>
        </div>

        {report.observations && (
          <div className="space-y-2">
            <h3 className="font-semibold">Observations générales</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <p>{report.observations}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">Suivi nécessaire</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <p>{formatArrayToText(report.follow_up)}</p>
            {report.follow_up_other && (
              <p className="mt-2"><strong>Autres :</strong> {report.follow_up_other}</p>
            )}
          </div>
        </div>

        {report.media_files && report.media_files.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Photos et documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.media_files.map((media: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  {media.preview ? (
                    <div className="w-full mb-2">
                      <img
                        src={media.preview}
                        alt={media.name || `Media ${index + 1}`}
                        className="w-full h-auto object-contain rounded max-h-64"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <p className="text-xs text-gray-600 truncate">{media.name || `Media ${index + 1}`}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section audio améliorée */}
        <div className="space-y-2">
          <h3 className="font-semibold">Enregistrement audio</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            {audioStatus === 'loading' && (
              <div className="flex items-center justify-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">Vérification de l'enregistrement audio...</span>
              </div>
            )}
            
            {audioStatus === 'valid' && report.audio_url && (
              <div>
                <p className="text-sm text-green-600 mb-2">✅ Enregistrement audio disponible</p>
                <VoiceAnswerPlayer
                  audioUrl={report.audio_url}
                  readOnly={true}
                  shouldLog={true}
                />
              </div>
            )}
            
            {audioStatus === 'expired' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-orange-800 mb-1">
                      Enregistrement audio expiré
                    </h4>
                    <p className="text-sm text-orange-700">
                      L'enregistrement audio de ce rapport était temporaire et n'est plus disponible. 
                      Vous pouvez modifier le rapport pour créer un nouvel enregistrement.
                    </p>
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-100 mt-2"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier le rapport
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {audioStatus === 'none' && (
              <p className="text-gray-500 text-sm">Aucun enregistrement audio</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterventionReportView;
