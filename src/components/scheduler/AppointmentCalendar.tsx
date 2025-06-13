
import React from 'react';
import { Scheduler } from '@aldabil/react-scheduler';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileText, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuxiliaryAvatar from './AuxiliaryAvatar';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAppointmentEdit: (appointment: Appointment) => void;
  onAppointmentDelete: (appointmentId: string) => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  onAppointmentEdit,
  onAppointmentDelete,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Convertir les appointments vers le format requis par react-scheduler
  const events = appointments.map(appointment => ({
    event_id: appointment.id,
    title: `${appointment.client?.first_name} ${appointment.client?.last_name}`,
    start: new Date(appointment.start_time),
    end: new Date(appointment.end_time),
    disabled: false,
    color: appointment.client?.color || '#3174ad',
    // Stocker toutes les données de l'appointment pour y accéder plus tard
    appointment: appointment,
  }));

  const handleReportClick = (appointment: Appointment) => {
    if (appointment.intervention_report_id) {
      navigate(`/intervention-report?reportId=${appointment.intervention_report_id}`);
    }
  };

  const handleDeleteClick = async (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      await onAppointmentDelete(appointment.id);
    }
  };

  const handleEditClick = (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    onAppointmentEdit(appointment);
  };

  // Composant personnalisé pour l'affichage des événements
  const EventRenderer = ({ event }: any) => {
    const appointment = event.appointment as Appointment;
    const hasReport = appointment?.intervention_report_id;
    
    // Utiliser les initiales de l'intervenant s'il existe, sinon celles de l'utilisateur connecté
    const displayName = appointment?.intervenant 
      ? `${appointment.intervenant.first_name} ${appointment.intervenant.last_name}`
      : user?.email?.split('@')[0] || 'Auxiliaire';
    
    return (
      <div className="p-2">
        <div className="text-xs font-medium flex items-center gap-1 mb-1">
          <div className="flex items-center gap-1">
            <AuxiliaryAvatar 
              name={displayName} 
              size="sm" 
            />
            {hasReport && (
              <div className="bg-green-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                <FileText className="h-2.5 w-2.5" />
              </div>
            )}
          </div>
        </div>
        <div className="text-xs mb-1">
          <div className="font-medium">{event.title}</div>
        </div>
        {appointment?.notes && (
          <div className="text-xs opacity-75 mb-1">
            <div className="truncate">{appointment.notes}</div>
          </div>
        )}
        <div className="flex gap-1 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-5 w-5 p-0 bg-white border-gray-300 hover:bg-gray-50"
            onClick={(e) => {
              if (appointment) handleEditClick(appointment, e);
            }}
          >
            <Edit className="h-3 w-3 text-gray-700" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-5 w-5 p-0 bg-white border-gray-300 hover:bg-gray-50"
            onClick={(e) => {
              if (appointment) {
                handleDeleteClick(appointment, e);
              }
            }}
          >
            <Trash2 className="h-3 w-3 text-gray-700" />
          </Button>
          {hasReport && (
            <Button
              size="sm"
              variant="outline"
              className="h-5 w-5 p-0 bg-green-50 border-green-300 hover:bg-green-100"
              onClick={(e) => {
                e.stopPropagation();
                if (appointment) handleReportClick(appointment);
              }}
            >
              <FileText className="h-3 w-3 text-green-600" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[600px]">
      <Scheduler
        locale={fr}
        events={events}
        view="week"
        week={{
          weekDays: [0, 1, 2, 3, 4, 5, 6],
          weekStartOn: 1, // Commencer par lundi
          startHour: 7,
          endHour: 20,
          step: 30,
          navigation: true,
          disableGoToDay: false,
        }}
        month={{
          weekDays: [0, 1, 2, 3, 4, 5, 6],
          weekStartOn: 1,
          navigation: true,
        }}
        day={{
          startHour: 7,
          endHour: 20,
          step: 30,
          navigation: true,
        }}
        agenda={{
          navigation: true,
        }}
        hourFormat="24"
        translations={{
          navigation: {
            month: "Mois",
            week: "Semaine", 
            day: "Jour",
            today: "Aujourd'hui",
            agenda: "Agenda"
          },
          form: {
            addTitle: "Ajouter un événement",
            editTitle: "Modifier l'événement",
            confirm: "Confirmer",
            delete: "Supprimer",
            cancel: "Annuler"
          },
          event: {
            title: "Titre",
            start: "Début",
            end: "Fin",
            allDay: "Toute la journée"
          },
          moreEvents: "plus...",
          noDataToDisplay: "Aucun rendez-vous à afficher",
          loading: "Chargement..."
        }}
        onConfirm={(event, action) => {
          // Gérer les créations/modifications d'événements
          if (action === "edit" && event.appointment) {
            onAppointmentEdit(event.appointment);
          }
          return Promise.resolve(event);
        }}
        onDelete={(deletedId) => {
          // Trouver l'appointment correspondant et le supprimer
          const event = events.find(e => e.event_id === deletedId);
          if (event?.appointment) {
            onAppointmentDelete(event.appointment.id);
          }
          return Promise.resolve(deletedId);
        }}
        customEditor={() => <div />} // Désactiver l'éditeur intégré
        viewerExtraComponent={(fields, event) => {
          const appointment = event.appointment as Appointment;
          if (!appointment) return null;
          
          return (
            <div className="p-3 border-t">
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditClick(appointment, {} as React.MouseEvent)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteClick(appointment, {} as React.MouseEvent)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
                {appointment.intervention_report_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReportClick(appointment)}
                    className="flex items-center gap-1 bg-green-50"
                  >
                    <FileText className="h-4 w-4" />
                    Rapport
                  </Button>
                )}
              </div>
            </div>
          );
        }}
        eventRenderer={EventRenderer}
      />
    </div>
  );
};

export default AppointmentCalendar;
