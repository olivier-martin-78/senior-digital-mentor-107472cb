
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types/appointments';

interface AppointmentSelectorProps {
  selectedAppointment: Appointment | null;
  showAppointmentSelector: boolean;
  appointments: Appointment[];
  onAppointmentChange: (appointmentId: string) => void;
  onShowSelector: () => void;
  onHideSelector: () => void;
  appointmentId: string;
}

export const AppointmentSelector: React.FC<AppointmentSelectorProps> = ({
  selectedAppointment,
  showAppointmentSelector,
  appointments,
  onAppointmentChange,
  onShowSelector,
  onHideSelector,
  appointmentId,
}) => {
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
            onClick={onShowSelector}
          >
            Changer le rendez-vous associé
          </Button>
        </div>
      ) : showAppointmentSelector && appointments.length > 0 ? (
        <div className="space-y-2">
          <Select onValueChange={onAppointmentChange} value={appointmentId || ""}>
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
            onClick={onHideSelector}
          >
            Annuler la sélection
          </Button>
        </div>
      ) : (
        <div className="p-3 bg-gray-50 rounded-md border">
          <div className="text-sm text-gray-500">
            Aucun rendez-vous associé
          </div>
          {appointments.length > 0 && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs"
              onClick={onShowSelector}
            >
              Associer un rendez-vous
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
