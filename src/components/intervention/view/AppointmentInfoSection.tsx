
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface AppointmentInfoSectionProps {
  appointment: any;
}

export const AppointmentInfoSection: React.FC<AppointmentInfoSectionProps> = ({ appointment }) => {
  if (!appointment) return null;

  return (
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
  );
};
