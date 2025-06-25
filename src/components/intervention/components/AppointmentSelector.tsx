
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types/appointments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentSelectorProps {
  selectedAppointment: Appointment | null;
  selectedAppointmentId: string | null;
  onAppointmentChange: (appointmentId: string) => void;
}

export const AppointmentSelector: React.FC<AppointmentSelectorProps> = ({
  selectedAppointment,
  selectedAppointmentId,
  onAppointmentChange,
}) => {
  const { user } = useAuth();
  const [showAppointmentSelector, setShowAppointmentSelector] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          intervenant:intervenants(*)
        `)
        .eq('professional_id', user.id)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedAppointments = data?.map((appointment) => ({
        ...appointment,
        caregivers: [], // Default empty array
        status: (appointment.status as 'scheduled' | 'completed' | 'cancelled') || 'scheduled',
        recurrence_type: appointment.recurrence_type as 'weekly' | 'monthly' | undefined
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showAppointmentSelector && appointments.length === 0) {
      loadAppointments();
    }
  }, [showAppointmentSelector]);

  const handleAppointmentChange = (value: string) => {
    if (value === "none") {
      onAppointmentChange("");
    } else {
      onAppointmentChange(value);
    }
  };

  return (
    <div>
      <Label htmlFor="appointment">Rendez-vous associé</Label>
      {selectedAppointment ? (
        <div className="p-3 bg-gray-50 rounded-md border">
          <div className="text-sm font-medium">
            {selectedAppointment.client?.first_name} {selectedAppointment.client?.last_name} - {' '}
            {new Date(selectedAppointment.start_time).toLocaleDateString()} {' '}
            {new Date(selectedAppointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {selectedAppointment.intervenant && ` (${selectedAppointment.intervenant.first_name} ${selectedAppointment.intervenant.last_name})`}
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="p-0 h-auto text-xs"
            onClick={() => setShowAppointmentSelector(true)}
          >
            Changer le rendez-vous associé
          </Button>
        </div>
      ) : showAppointmentSelector ? (
        <div className="space-y-2">
          {loading ? (
            <div className="p-3 bg-gray-50 rounded-md border text-sm text-gray-500">
              Chargement des rendez-vous...
            </div>
          ) : appointments.length > 0 ? (
            <>
              <Select onValueChange={handleAppointmentChange} value={selectedAppointmentId || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rendez-vous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun rendez-vous</SelectItem>
                  {appointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id}>
                      {appointment.client?.first_name} {appointment.client?.last_name} - {' '}
                      {new Date(appointment.start_time).toLocaleDateString()} {' '}
                      {new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {appointment.intervenant && ` (${appointment.intervenant.first_name} ${appointment.intervenant.last_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAppointmentSelector(false)}
              >
                Annuler la sélection
              </Button>
            </>
          ) : (
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="text-sm text-gray-500">
                Aucun rendez-vous programmé trouvé
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAppointmentSelector(false)}
              >
                Fermer
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-gray-50 rounded-md border">
          <div className="text-sm text-gray-500">
            Aucun rendez-vous associé
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="p-0 h-auto text-xs"
            onClick={() => setShowAppointmentSelector(true)}
          >
            Associer un rendez-vous
          </Button>
        </div>
      )}
    </div>
  );
};
