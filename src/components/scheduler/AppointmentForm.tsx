import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, X, FileText } from 'lucide-react';
import { Appointment, Client, Intervenant } from '@/types/appointments';
import RecurringAppointmentForm from './RecurringAppointmentForm';
import { addWeeks } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  clients: Client[];
  intervenants: Intervenant[];
  onSave: () => void;
  onCancel: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  clients,
  intervenants,
  onSave,
  onCancel
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allowedClients, setAllowedClients] = useState<Client[]>([]);
  const [availableIntervenants, setAvailableIntervenants] = useState<Intervenant[]>([]);
  const [hasInterventionReport, setHasInterventionReport] = useState(false);
  const [interventionReportId, setInterventionReportId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_id: appointment?.client_id || '',
    intervenant_id: appointment?.intervenant_id || '',
    start_time: appointment ? new Date(appointment.start_time).toISOString().slice(0, 16) : '',
    end_time: appointment ? new Date(appointment.end_time).toISOString().slice(0, 16) : '',
    notes: appointment?.notes || '',
    status: appointment?.status || 'scheduled' as const,
    is_recurring: appointment?.is_recurring || false,
    recurrence_type: appointment?.recurrence_type || 'weekly',
    recurrence_end_date: appointment?.recurrence_end_date || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllowedData();
    if (appointment) {
      checkInterventionReport();
    }
  }, [user, clients, intervenants, appointment]);

  const checkInterventionReport = async () => {
    if (!appointment) return;

    console.log('🔍 Vérification du rapport pour le RDV:', appointment.id);
    console.log('🔍 intervention_report_id depuis appointment:', appointment.intervention_report_id);

    try {
      // Première vérification : utiliser intervention_report_id si présent
      if (appointment.intervention_report_id) {
        console.log('📋 Rapport trouvé via intervention_report_id:', appointment.intervention_report_id);
        setHasInterventionReport(true);
        setInterventionReportId(appointment.intervention_report_id);
        return;
      }

      // Deuxième vérification : chercher par appointment_id
      const { data, error } = await supabase
        .from('intervention_reports')
        .select('id')
        .eq('appointment_id', appointment.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur lors de la vérification du rapport:', error);
        return;
      }

      if (data) {
        console.log('📋 Rapport trouvé via recherche par appointment_id:', data.id);
        setHasInterventionReport(true);
        setInterventionReportId(data.id);
      } else {
        console.log('❌ Aucun rapport trouvé pour ce rendez-vous');
        setHasInterventionReport(false);
        setInterventionReportId(null);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du rapport:', error);
    }
  };

  const handleInterventionReport = () => {
    if (!appointment) return;

    if (hasInterventionReport && interventionReportId) {
      // Ouvrir le rapport existant en mode lecture dans l'onglet actuel
      console.log('📖 Ouverture du rapport existant:', interventionReportId);
      navigate(`/intervention-report?report_id=${interventionReportId}&from=my-appointments&tab=completed`);
    } else {
      // Créer un nouveau rapport dans l'onglet actuel
      console.log('📝 Création d\'un nouveau rapport pour RDV:', appointment.id);
      navigate(`/intervention-report?appointment_id=${appointment.id}&from=my-appointments&tab=completed`);
    }
  };

  const loadAllowedData = async () => {
    if (!user) return;

    console.log('🔍 APPOINTMENT_FORM - Chargement des données autorisées...');
    console.log('🔍 APPOINTMENT_FORM - Props reçues - Clients:', clients.length, 'Intervenants:', intervenants.length);
    
    // 1. Filtrer les clients actifs (pas d'inactive = true)
    const activeClients = clients.filter(client => !client.inactive);
    console.log('🔍 APPOINTMENT_FORM - Clients actifs:', activeClients.length);

    // 2. Charger les clients autorisés via les permissions
    const { data: clientPermissions, error: clientError } = await supabase
      .from('user_client_permissions')
      .select(`
        client_id,
        clients!inner(*)
      `)
      .eq('user_id', user.id);

    if (!clientError && clientPermissions) {
      const permissionClients = clientPermissions
        .map(p => p.clients)
        .filter(client => !client.inactive); // Filtrer les clients inactifs des permissions aussi
      
      // Fusionner en évitant les doublons
      permissionClients.forEach(permClient => {
        if (!activeClients.find(c => c.id === permClient.id)) {
          activeClients.push(permClient);
        }
      });
      console.log('🔍 APPOINTMENT_FORM - Clients via permissions (actifs):', permissionClients.length);
    }

    // 3. Si un rendez-vous existe et qu'il a un client assigné, l'ajouter aussi (même s'il est inactif)
    if (appointment?.client_id && appointment.client) {
      const existingClient = activeClients.find(c => c.id === appointment.client_id);
      if (!existingClient) {
        activeClients.push(appointment.client);
        console.log('🔍 APPOINTMENT_FORM - Client du rendez-vous ajouté:', appointment.client);
      }
    }

    console.log('🔍 APPOINTMENT_FORM - Total clients autorisés et actifs:', activeClients.length);
    setAllowedClients(activeClients);

    // 4. Filtrer les intervenants actifs
    const activeIntervenants = intervenants.filter(intervenant => intervenant.active);
    console.log('🔍 APPOINTMENT_FORM - Intervenants actifs (props):', activeIntervenants.length);

    // 5. Charger les intervenants autorisés via les permissions (actifs seulement)
    const { data: intervenantPermissions, error: intervenantError } = await supabase
      .from('user_intervenant_permissions')
      .select(`
        intervenant_id,
        intervenants!inner(*)
      `)
      .eq('user_id', user.id);

    if (!intervenantError && intervenantPermissions) {
      const permissionIntervenants = intervenantPermissions
        .map(p => p.intervenants)
        .filter(intervenant => intervenant.active); // Filtrer les intervenants inactifs
      
      // Fusionner en évitant les doublons
      permissionIntervenants.forEach(permIntervenant => {
        if (!activeIntervenants.find(i => i.id === permIntervenant.id)) {
          activeIntervenants.push(permIntervenant);
        }
      });
      console.log('🔍 APPOINTMENT_FORM - Intervenants via permissions (actifs):', permissionIntervenants.length);
    } else if (intervenantError) {
      console.error('🔍 APPOINTMENT_FORM - Erreur permissions intervenants:', intervenantError);
    }

    // 6. Si un rendez-vous existe et qu'il a un intervenant assigné, l'ajouter aussi (même s'il est inactif)
    if (appointment?.intervenant_id && appointment.intervenant) {
      const existingIntervenant = activeIntervenants.find(i => i.id === appointment.intervenant_id);
      if (!existingIntervenant) {
        activeIntervenants.push(appointment.intervenant);
        console.log('🔍 APPOINTMENT_FORM - Intervenant du rendez-vous ajouté:', appointment.intervenant);
      }
    }

    console.log('🔍 APPOINTMENT_FORM - Total intervenants autorisés et actifs:', activeIntervenants.length);
    console.log('🔍 APPOINTMENT_FORM - Liste des intervenants autorisés:', activeIntervenants.map(i => `${i.first_name} ${i.last_name} (${i.id})`));
    setAvailableIntervenants(activeIntervenants);
  };

  // Nouvelle fonction de validation des dates/heures
  const validateAppointmentTimes = (startTime: string, endTime: string): string | null => {
    if (!startTime || !endTime) {
      return null; // Les validations required s'en chargeront
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Vérifier que les dates sont valides
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Les dates saisies ne sont pas valides';
    }

    // Vérifier que l'heure de fin est postérieure à l'heure de début
    if (end <= start) {
      return 'L\'heure de fin doit être postérieure à l\'heure de début';
    }

    // Vérifier que les rendez-vous sont sur la même date
    const startDate = start.toDateString();
    const endDate = end.toDateString();
    if (startDate !== endDate) {
      return 'Le début et la fin du rendez-vous doivent être sur la même date';
    }

    // Vérifier que la durée ne dépasse pas 24 heures
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    if (durationHours > 24) {
      return 'La durée du rendez-vous ne peut pas dépasser 24 heures';
    }

    return null; // Pas d'erreur
  };

  // Fonction pour valider la date de fin de récurrence
  const validateRecurrenceEndDate = (startTime: string, endDate: string): string | null => {
    if (!startTime || !endDate) {
      return null;
    }

    const start = new Date(startTime);
    const end = new Date(endDate);

    if (end <= start) {
      return 'La date de fin de récurrence doit être postérieure à la date du premier rendez-vous';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.client_id || !formData.start_time || !formData.end_time) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    // Validation des dates/heures
    const timeValidationError = validateAppointmentTimes(formData.start_time, formData.end_time);
    if (timeValidationError) {
      toast({
        title: 'Erreur de validation',
        description: timeValidationError,
        variant: 'destructive',
      });
      return;
    }

    // Validation spécifique pour les rendez-vous récurrents
    if (formData.is_recurring) {
      if (!formData.recurrence_end_date) {
        toast({
          title: 'Erreur',
          description: 'Veuillez spécifier une date de fin pour les rendez-vous récurrents',
          variant: 'destructive',
        });
        return;
      }

      const recurrenceValidationError = validateRecurrenceEndDate(formData.start_time, formData.recurrence_end_date);
      if (recurrenceValidationError) {
        toast({
          title: 'Erreur de validation',
          description: recurrenceValidationError,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setLoading(true);

      if (appointment) {
        // CORRECTION V10 : Pour les mises à jour, ne pas écraser professional_id
        // Le trigger se chargera automatiquement de remplir updated_by_professional_id
        const updateData = {
          client_id: formData.client_id,
          intervenant_id: formData.intervenant_id || null,
          start_time: formData.start_time,
          end_time: formData.end_time,
          notes: formData.notes,
          status: formData.status,
          is_recurring: formData.is_recurring,
          recurrence_type: formData.recurrence_type || null,
          recurrence_end_date: formData.recurrence_end_date || null,
          // NE PAS inclure professional_id dans les mises à jour !
          // updated_by_professional_id sera automatiquement rempli par le trigger
        };

        console.log('🔧 CORRECTION V10 - Mise à jour sans écraser professional_id:', {
          appointmentId: appointment.id,
          originalProfessionalId: appointment.professional_id,
          currentUserId: user.id,
          updateData
        });

        const { error } = await supabase
          .from('appointments')
          .update(updateData)
          .eq('id', appointment.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rendez-vous mis à jour avec succès',
        });
      } else {
        // Création : inclure professional_id normalement
        const appointmentData = {
          client_id: formData.client_id,
          intervenant_id: formData.intervenant_id || null,
          professional_id: user.id, // Seulement lors de la création
          start_time: formData.start_time,
          end_time: formData.end_time,
          notes: formData.notes,
          status: formData.status,
          is_recurring: formData.is_recurring,
          recurrence_type: formData.is_recurring ? 'weekly' : null,
          recurrence_end_date: formData.recurrence_end_date || null,
        };

        console.log('📅 CRÉATION RENDEZ-VOUS - Données:', {
          appointmentData,
          isRecurring: formData.is_recurring,
          recurrenceEndDate: formData.recurrence_end_date
        });

        if (formData.is_recurring && formData.recurrence_end_date) {
          // Gérer les rendez-vous récurrents
          const createdCount = await createRecurringAppointments(appointmentData);
          console.log('📅 RÉCURRENCE - Rendez-vous créés:', createdCount);
          
          toast({
            title: 'Succès',
            description: `${createdCount} rendez-vous récurrents créés avec succès`,
          });
        } else {
          // Rendez-vous unique
          const { error } = await supabase
            .from('appointments')
            .insert([appointmentData]);

          if (error) throw error;

          console.log('📅 UNIQUE - Rendez-vous créé avec succès');
          
          toast({
            title: 'Succès',
            description: 'Rendez-vous créé avec succès',
          });
        }
      }

      onSave();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le rendez-vous',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createRecurringAppointments = async (baseData: any) => {
    console.log('🔄 CRÉATION RÉCURRENCE - Début avec données:', baseData);
    
    const appointments = [];
    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);
    const finalDate = new Date(formData.recurrence_end_date);
    
    // Calculer la durée du rendez-vous
    const duration = endDate.getTime() - startDate.getTime();
    
    console.log('🔄 RÉCURRENCE - Paramètres:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      finalDate: finalDate.toISOString(),
      duration: duration / (1000 * 60) + ' minutes'
    });

    // CORRECTION : Inclure le rendez-vous initial dans la série
    let currentDate = new Date(startDate);
    
    // Supprimer les rendez-vous récurrents existants pour ce client et ce professionnel
    // sur le même jour de la semaine dans la plage de dates
    const dayOfWeek = startDate.getDay();
    
    console.log('🗑️ NETTOYAGE - Suppression des anciens rendez-vous récurrents...');
    
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('client_id', formData.client_id)
      .eq('professional_id', user?.id)
      .eq('is_recurring', true)
      .gte('start_time', currentDate.toISOString())
      .lte('start_time', finalDate.toISOString());

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression des anciens rendez-vous:', deleteError);
    } else {
      console.log('✅ Anciens rendez-vous récurrents supprimés');
    }
    
    // Créer tous les rendez-vous de la série (y compris le premier)
    while (currentDate <= finalDate) {
      // Vérifier que c'est bien le même jour de la semaine
      if (currentDate.getDay() === dayOfWeek) {
        const appointmentEndTime = new Date(currentDate.getTime() + duration);
        
        console.log('📅 CRÉATION - Rendez-vous:', {
          date: currentDate.toISOString(),
          endTime: appointmentEndTime.toISOString(),
          dayOfWeek: currentDate.getDay()
        });
        
        appointments.push({
          client_id: baseData.client_id,
          professional_id: baseData.professional_id,
          intervenant_id: baseData.intervenant_id, // CORRECTION : Inclure l'intervenant
          start_time: currentDate.toISOString(),
          end_time: appointmentEndTime.toISOString(),
          notes: baseData.notes,
          status: baseData.status,
          is_recurring: true,
          recurrence_type: 'weekly', // CORRECTION : Définir explicitement
          recurrence_end_date: baseData.recurrence_end_date,
          email_sent: false
        });
      }
      
      currentDate = addWeeks(currentDate, 1);
    }
    
    console.log('📋 INSERTION - Nombre de rendez-vous à créer:', appointments.length);
    console.log('📋 DÉTAIL des rendez-vous:', appointments.map(apt => ({
      start: apt.start_time,
      end: apt.end_time,
      intervenant: apt.intervenant_id
    })));
    
    if (appointments.length > 0) {
      const { error, data } = await supabase
        .from('appointments')
        .insert(appointments)
        .select();
        
      if (error) {
        console.error('❌ Erreur lors de l\'insertion des rendez-vous récurrents:', error);
        throw error;
      }
      
      console.log('✅ SUCCÈS - Rendez-vous récurrents insérés:', data?.length);
    }
    
    return appointments.length;
  };

  const selectedClient = allowedClients.find(c => c.id === formData.client_id);

  // Calculer l'erreur de validation en temps réel
  const timeValidationError = validateAppointmentTimes(formData.start_time, formData.end_time);
  const recurrenceValidationError = formData.is_recurring 
    ? validateRecurrenceEndDate(formData.start_time, formData.recurrence_end_date)
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="client">Client *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {allowedClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                      {client.inactive && " (Inactif)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="intervenant">Intervenant</Label>
              <Select value={formData.intervenant_id || "none"} onValueChange={(value) => setFormData({ ...formData, intervenant_id: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un intervenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun intervenant</SelectItem>
                  {availableIntervenants.map((intervenant) => (
                    <SelectItem key={intervenant.id} value={intervenant.id}>
                      {intervenant.first_name} {intervenant.last_name}
                      {intervenant.email === user?.email && " (Vous)"}
                      {!intervenant.active && " (Inactif)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Début *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">Fin *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Afficher l'erreur de validation si elle existe */}
            {timeValidationError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {timeValidationError}
              </div>
            )}

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value: 'scheduled' | 'completed' | 'cancelled') => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>

            {!appointment && (
              <>
                <RecurringAppointmentForm
                  isRecurring={formData.is_recurring}
                  endDate={formData.recurrence_end_date}
                  onRecurringChange={(isRecurring) => setFormData({ 
                    ...formData, 
                    is_recurring: isRecurring,
                    recurrence_type: isRecurring ? 'weekly' : undefined
                  })}
                  onEndDateChange={(date) => setFormData({ ...formData, recurrence_end_date: date })}
                />
                
                {/* Afficher l'erreur de validation de récurrence si elle existe */}
                {recurrenceValidationError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {recurrenceValidationError}
                  </div>
                )}
              </>
            )}

            {/* Bouton pour gérer le rapport d'intervention - affiché seulement en mode modification */}
            {appointment && (
              <div className="pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleInterventionReport}
                  className="w-full flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {hasInterventionReport ? 'Voir le rapport' : 'Créer un rapport'}
                </Button>
                {/* Debug info pour diagnostiquer */}
                <div className="text-xs text-gray-500 mt-1">
                  Debug: hasReport={hasInterventionReport ? 'oui' : 'non'}, reportId={interventionReportId || 'aucun'}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !!timeValidationError || !!recurrenceValidationError} 
                className="flex-1"
              >
                {loading ? 'Sauvegarde...' : appointment ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentForm;
