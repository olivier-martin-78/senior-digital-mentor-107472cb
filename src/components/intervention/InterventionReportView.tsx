
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Trash2, ArrowLeft, Calendar, Clock, User, MapPin } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Appointment, Client, Intervenant } from '@/types/appointments';

const InterventionReportView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report_id');

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId, user]);

  const loadReport = async () => {
    if (!reportId || !user) return;

    try {
      setLoading(true);
      
      // Charger le rapport
      const { data: reportData, error: reportError } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) {
        console.error('Erreur lors du chargement du rapport:', reportError);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le rapport d\'intervention',
          variant: 'destructive',
        });
        navigate('/scheduler');
        return;
      }

      setReport(reportData);

      // Si le rapport a un appointment_id, charger le rendez-vous associé
      if (reportData.appointment_id) {
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select(`
            *,
            clients:client_id (
              *
            ),
            intervenants:intervenant_id (
              *
            )
          `)
          .eq('id', reportData.appointment_id)
          .single();

        if (appointmentData && !appointmentError) {
          const transformedAppointment = {
            ...appointmentData,
            status: appointmentData.status as 'scheduled' | 'completed' | 'cancelled',
            client: appointmentData.clients,
            intervenant: appointmentData.intervenants,
            caregivers: []
          };
          setAppointment(transformedAppointment);
        }
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
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

      // Supprimer le rapport
      const { error } = await supabase
        .from('intervention_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Si un rendez-vous était associé, retirer l'association
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
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!report) {
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

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport d'intervention
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/scheduler')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
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
        {/* Informations de base */}
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

          {/* Rendez-vous associé */}
          {appointment && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Rendez-vous associé
              </h3>
              <div className="bg-gray-50 p-3 rounded-md space-y-1">
                <p><strong>Client :</strong> {appointment.client?.first_name} {appointment.client?.last_name}</p>
                {appointment.client?.address && (
                  <p><strong>Adresse :</strong> {appointment.client.address}</p>
                )}
                <p><strong>Intervenant :</strong> {appointment.intervenant?.first_name} {appointment.intervenant?.last_name}</p>
                <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                  {appointment.status === 'completed' ? 'Terminé' : 'Programmé'}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Activités */}
        <div className="space-y-2">
          <h3 className="font-semibold">Activités réalisées</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <p>{formatArrayToText(report.activities)}</p>
            {report.activities_other && (
              <p className="mt-2"><strong>Autres :</strong> {report.activities_other}</p>
            )}
          </div>
        </div>

        {/* État physique */}
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

        {/* Hygiène */}
        <div className="space-y-2">
          <h3 className="font-semibold">Hygiène</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <p>{formatArrayToText(report.hygiene)}</p>
            {report.hygiene_comments && (
              <p className="mt-2"><strong>Commentaires :</strong> {report.hygiene_comments}</p>
            )}
          </div>
        </div>

        {/* Appétit et hydratation */}
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

        {/* Observations */}
        {report.observations && (
          <div className="space-y-2">
            <h3 className="font-semibold">Observations générales</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <p>{report.observations}</p>
            </div>
          </div>
        )}

        {/* Suivi */}
        <div className="space-y-2">
          <h3 className="font-semibold">Suivi nécessaire</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <p>{formatArrayToText(report.follow_up)}</p>
            {report.follow_up_other && (
              <p className="mt-2"><strong>Autres :</strong> {report.follow_up_other}</p>
            )}
          </div>
        </div>

        {/* Médias */}
        {report.media_files && report.media_files.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Photos et documents</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {report.media_files.map((media: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  {media.preview ? (
                    <img
                      src={media.preview}
                      alt={media.name || `Media ${index + 1}`}
                      className="w-full h-20 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-full h-20 bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <p className="text-xs text-gray-600 truncate">{media.name || `Media ${index + 1}`}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio */}
        {report.audio_url && (
          <div className="space-y-2">
            <h3 className="font-semibold">Enregistrement audio</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <audio controls src={report.audio_url} className="w-full">
                Votre navigateur ne supporte pas l'élément audio.
              </audio>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterventionReportView;
