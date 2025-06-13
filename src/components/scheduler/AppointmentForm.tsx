import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Client, Appointment, Intervenant } from '@/types/appointments';
import { format, addDays, addWeeks } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import RecurringAppointmentForm from './RecurringAppointmentForm';
import { FileText } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '',
    intervenant_id: '',
    start_time: '',
    end_time: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    is_recurring: false,
    recurrence_end_date: ''
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        client_id: appointment.client_id,
        intervenant_id: appointment.intervenant_id || '',
        start_time: format(new Date(appointment.start_time), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(appointment.end_time), "yyyy-MM-dd'T'HH:mm"),
        notes: appointment.notes || '',
        status: appointment.status,
        is_recurring: appointment.is_recurring || false,
        recurrence_end_date: appointment.recurrence_end_date || ''
      });
    } else {
      // Valeurs par défaut pour un nouveau rendez-vous
      const now = new Date();
      const startTime = format(now, "yyyy-MM-dd'T'09:00");
      const endTime = format(now, "yyyy-MM-dd'T'11:00");
      
      setFormData({
        client_id: '',
        intervenant_id: '',
        start_time: startTime,
        end_time: endTime,
        notes: '',
        status: 'scheduled',
        is_recurring: false,
        recurrence_end_date: ''
      });
    }
  }, [appointment]);

  const createRecurringAppointments = async (baseData: any, endDate: string, parentId: string) => {
    const appointments = [];
    const startDate = new Date(formData.start_time);
    const finalDate = new Date(endDate);
    
    let currentDate = addWeeks(startDate, 1); // Commencer la semaine suivante
    
    // Supprimer les rendez-vous récurrents existants pour ce client et ce professionnel
    // sur le même jour de la semaine dans la plage de dates
    const dayOfWeek = startDate.getDay();
    
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('client_id', formData.client_id)
      .eq('professional_id', user?.id)
      .eq('is_recurring', true)
      .gte('start_time', currentDate.toISOString())
      .lte('start_time', finalDate.toISOString());

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciens rendez-vous:', deleteError);
    }
    
    while (currentDate <= finalDate) {
      // Vérifier que c'est bien le même jour de la semaine
      if (currentDate.getDay() === dayOfWeek) {
        const duration = new Date(formData.end_time).getTime() - new Date(formData.start_time).getTime();
        const endTime = new Date(currentDate.getTime() + duration);
        
        appointments.push({
          client_id: baseData.client_id,
          professional_id: baseData.professional_id,
          start_time: currentDate.toISOString(),
          end_time: endTime.toISOString(),
          notes: baseData.notes,
          status: baseData.status,
          is_recurring: true,
          recurrence_type: 'weekly',
          recurrence_end_date: baseData.recurrence_end_date,
          parent_appointment_id: parentId,
          email_sent: false
        });
      }
      
      currentDate = addWeeks(currentDate, 1);
    }
    
    if (appointments.length > 0) {
      const { error } = await supabase
        .from('appointments')
        .insert(appointments);
        
      if (error) {
        console.error('Erreur lors de l\'insertion des rendez-vous récurrents:', error);
        throw error;
      }
    }
    
    return appointments.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const appointmentData = {
        client_id: formData.client_id,
        professional_id: user.id,
        intervenant_id: formData.intervenant_id || null,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        notes: formData.notes,
        status: formData.status,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? 'weekly' as const : null,
        recurrence_end_date: formData.is_recurring ? formData.recurrence_end_date : null,
        email_sent: false
      };

      if (appointment?.id) {
        // Mise à jour d'un rendez-vous existant
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Rendez-vous mis à jour avec succès',
        });
      } else {
        // Création d'un nouveau rendez-vous
        const { data: newAppointment, error } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()
          .single();

        if (error) {
          console.error('Erreur lors de la création du rendez-vous principal:', error);
          throw error;
        }

        // Si c'est récurrent, créer les autres rendez-vous
        if (formData.is_recurring && formData.recurrence_end_date) {
          const recurringCount = await createRecurringAppointments(
            appointmentData, 
            formData.recurrence_end_date,
            newAppointment.id
          );
          
          toast({
            title: 'Succès',
            description: `Rendez-vous créé avec succès${recurringCount > 0 ? ` (${recurringCount + 1} rendez-vous au total)` : ''}`,
          });
        } else {
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

  const handleViewIntervention = async () => {
    if (!appointment?.intervention_report_id) return;

    try {
      const { data: reportData, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', appointment.intervention_report_id)
        .single();

      if (error) throw error;

      navigate(`/intervention-report?reportId=${appointment.intervention_report_id}&appointmentId=${appointment.id}`, {
        state: {
          appointmentId: appointment.id,
          prefilledData: reportData
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le rapport d\'intervention',
        variant: 'destructive',
      });
    }
  };

  const handleCreateIntervention = async () => {
    if (!appointment) return;

    // Vérifier qu'un intervenant est sélectionné dans le formulaire
    if (!formData.intervenant_id) {
      toast({
        title: 'Intervenant requis',
        description: 'Veuillez d\'abord sélectionner un intervenant pour ce rendez-vous avant de créer le rapport d\'intervention.',
        variant: 'destructive',
      });
      return;
    }

    // Sauvegarder d'abord le rendez-vous avec l'intervenant sélectionné
    try {
      setLoading(true);
      
      const appointmentData = {
        client_id: formData.client_id,
        professional_id: user?.id,
        intervenant_id: formData.intervenant_id,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        notes: formData.notes,
        status: formData.status,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? 'weekly' as const : null,
        recurrence_end_date: formData.is_recurring ? formData.recurrence_end_date : null,
        email_sent: false
      };

      const { error } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', appointment.id);

      if (error) throw error;

      // Préparer les données pour le préremplissage
      const selectedClient = clients.find(c => c.id === formData.client_id);
      const selectedIntervenant = formData.intervenant_id 
        ? intervenants.find(i => i.id === formData.intervenant_id)
        : null;

      navigate('/intervention-report', {
        state: {
          appointmentId: appointment.id,
          isViewMode: false,
          prefilledData: {
            patient_name: selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '',
            auxiliary_name: selectedIntervenant 
              ? `${selectedIntervenant.first_name} ${selectedIntervenant.last_name}`
              : user?.email?.split('@')[0] || '',
            date: format(new Date(formData.start_time), 'yyyy-MM-dd'),
            start_time: format(new Date(formData.start_time), 'HH:mm'),
            end_time: format(new Date(formData.end_time), 'HH:mm'),
            hourly_rate: selectedClient?.hourly_rate || 0,
            observations: formData.notes || ''
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rendez-vous:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le rendez-vous',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activeIntervenants = intervenants.filter(intervenant => intervenant.active);

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervenant">Intervenant</Label>
              <Select
                value={formData.intervenant_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, intervenant_id: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un intervenant (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun intervenant spécifique</SelectItem>
                  {activeIntervenants.map((intervenant) => (
                    <SelectItem key={intervenant.id} value={intervenant.id}>
                      {intervenant.first_name} {intervenant.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Début</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Fin</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Programmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes supplémentaires..."
              rows={3}
            />
          </div>

          {!appointment && (
            <RecurringAppointmentForm
              isRecurring={formData.is_recurring}
              onRecurringChange={(isRecurring) => setFormData(prev => ({ ...prev, is_recurring: isRecurring }))}
              endDate={formData.recurrence_end_date}
              onEndDateChange={(endDate) => setFormData(prev => ({ ...prev, recurrence_end_date: endDate }))}
            />
          )}

          <div className="flex justify-between gap-4">
            <div className="flex gap-2">
              {appointment?.intervention_report_id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleViewIntervention}
                >
                  Voir l'intervention
                </Button>
              )}
              
              {appointment && !appointment.intervention_report_id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateIntervention}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <FileText className="w-4 h-4" />
                  Créer l'intervention
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sauvegarde...' : (appointment ? 'Mettre à jour' : 'Créer')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;
