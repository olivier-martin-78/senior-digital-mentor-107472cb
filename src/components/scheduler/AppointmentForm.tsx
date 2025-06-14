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
import { Calendar, Clock, User, X } from 'lucide-react';
import { Appointment, Client, Intervenant } from '@/types/appointments';
import RecurringAppointmentForm from './RecurringAppointmentForm';
import { addWeeks } from 'date-fns';

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
  const [allIntervenants, setAllIntervenants] = useState<Intervenant[]>([]);
  const [formData, setFormData] = useState({
    client_id: appointment?.client_id || '',
    intervenant_id: appointment?.intervenant_id || '',
    start_time: appointment ? new Date(appointment.start_time).toISOString().slice(0, 16) : '',
    end_time: appointment ? new Date(appointment.end_time).toISOString().slice(0, 16) : '',
    notes: appointment?.notes || '',
    status: appointment?.status || 'scheduled' as const,
    is_recurring: appointment?.is_recurring || false,
    recurrence_type: appointment?.recurrence_type || undefined,
    recurrence_end_date: appointment?.recurrence_end_date || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllIntervenants();
  }, [user, intervenants]);

  const loadAllIntervenants = async () => {
    if (!user) return;

    console.log('🔍 APPOINTMENT_FORM - Chargement des intervenants...');
    
    // Commencer avec les intervenants fournis (créés par l'utilisateur)
    let allIntervenantsData = [...intervenants];
    
    // Si un rendez-vous existe et qu'il a un intervenant assigné
    if (appointment?.intervenant_id && appointment.intervenant) {
      const existingIntervenant = allIntervenantsData.find(i => i.id === appointment.intervenant_id);
      if (!existingIntervenant) {
        // Ajouter l'intervenant du rendez-vous s'il n'est pas déjà dans la liste
        allIntervenantsData.push(appointment.intervenant);
        console.log('🔍 APPOINTMENT_FORM - Intervenant du rendez-vous ajouté:', appointment.intervenant);
      }
    }

    // Rechercher si l'utilisateur connecté est un intervenant par email
    const { data: currentUserIntervenant, error } = await supabase
      .from('intervenants')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (!error && currentUserIntervenant) {
      const existingIntervenant = allIntervenantsData.find(i => i.id === currentUserIntervenant.id);
      if (!existingIntervenant) {
        allIntervenantsData.push(currentUserIntervenant);
        console.log('🔍 APPOINTMENT_FORM - Utilisateur intervenant ajouté:', currentUserIntervenant);
      }
    }

    console.log('🔍 APPOINTMENT_FORM - Total intervenants disponibles:', allIntervenantsData.length);
    setAllIntervenants(allIntervenantsData);
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

    try {
      setLoading(true);

      const appointmentData = {
        client_id: formData.client_id,
        intervenant_id: formData.intervenant_id || null,
        professional_id: user.id,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes,
        status: formData.status,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.recurrence_type || null,
        recurrence_end_date: formData.recurrence_end_date || null,
      };

      if (appointment) {
        // Mise à jour
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
        // Création
        if (formData.is_recurring && formData.recurrence_type && formData.recurrence_end_date) {
          // Gérer les rendez-vous récurrents
          await createRecurringAppointments(appointmentData);
        } else {
          // Rendez-vous unique
          const { error } = await supabase
            .from('appointments')
            .insert([appointmentData]);

          if (error) throw error;
        }

        toast({
          title: 'Succès',
          description: 'Rendez-vous créé avec succès',
        });
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
    const appointments = [];
    const startDate = new Date(formData.start_time);
    const finalDate = new Date(formData.recurrence_end_date);
    
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

  const selectedClient = clients.find(c => c.id === formData.client_id);

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
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
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
                  {allIntervenants.map((intervenant) => (
                    <SelectItem key={intervenant.id} value={intervenant.id}>
                      {intervenant.first_name} {intervenant.last_name}
                      {intervenant.email === user?.email && " (Vous)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Heure de début *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">Heure de fin *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

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
              <RecurringAppointmentForm
                isRecurring={formData.is_recurring}
                endDate={formData.recurrence_end_date}
                onRecurringChange={(isRecurring) => setFormData({ ...formData, is_recurring: isRecurring })}
                onEndDateChange={(date) => setFormData({ ...formData, recurrence_end_date: date })}
              />
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
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
