
import React from 'react';
import { Appointment } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, FileText, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AuxiliaryAvatar from './AuxiliaryAvatar';

interface MyAppointmentsProps {
  appointments: Appointment[];
  onAppointmentEdit: (appointment: Appointment) => void;
  defaultTab?: string;
}

const MyAppointments: React.FC<MyAppointmentsProps> = ({ 
  appointments, 
  onAppointmentEdit,
  defaultTab = 'scheduled'
}) => {
  // Filtrer et trier les rendez-vous planifiés (par date croissante)
  const scheduledAppointments = appointments
    .filter(appointment => appointment.status === 'scheduled')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Filtrer et trier les rendez-vous terminés (par date décroissante)
  const completedAppointments = appointments
    .filter(appointment => appointment.status === 'completed')
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: format(date, 'dd/MM/yyyy', { locale: fr }),
      time: format(date, 'HH:mm', { locale: fr })
    };
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const startDateTime = formatDateTime(appointment.start_time);
    const endDateTime = formatDateTime(appointment.end_time);
    const hasReport = appointment.intervention_report_id !== null;

    // Gérer les noms du client et de l'intervenant
    const clientName = appointment.client 
      ? `${appointment.client.first_name || ''} ${appointment.client.last_name || ''}`.trim()
      : 'Client non spécifié';
    
    const intervenantName = appointment.intervenant 
      ? `${appointment.intervenant.first_name || ''} ${appointment.intervenant.last_name || ''}`.trim()
      : null;

    console.log('Appointment data:', {
      id: appointment.id,
      client: appointment.client,
      intervenant: appointment.intervenant,
      clientName,
      intervenantName
    });

    return (
      <Card key={appointment.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {startDateTime.date}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {startDateTime.time} - {endDateTime.time}
                </div>
                {hasReport && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <FileText className="w-4 h-4" />
                    Rapport
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    Client: {clientName}
                  </span>
                </div>

                {intervenantName && (
                  <div className="flex items-center gap-2">
                    <AuxiliaryAvatar name={intervenantName} size="sm" />
                    <span className="text-sm text-gray-700">
                      Intervenant: {intervenantName}
                    </span>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="text-sm text-gray-600 mt-2">
                  <strong>Notes:</strong> {appointment.notes}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAppointmentEdit(appointment)}
                className="flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Modifier RDV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mes Rendez-vous</CardTitle>
          <CardDescription>Consultez vos rendez-vous planifiés et terminés.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scheduled">
                Planifiés ({scheduledAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Terminés ({completedAppointments.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scheduled" className="mt-4">
              {scheduledAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun rendez-vous planifié
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledAppointments.map(renderAppointmentCard)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              {completedAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun rendez-vous terminé
                </div>
              ) : (
                <div className="space-y-4">
                  {completedAppointments.map(renderAppointmentCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyAppointments;
