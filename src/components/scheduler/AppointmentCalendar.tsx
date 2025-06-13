
import React from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileText, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuxiliaryAvatar from './AuxiliaryAvatar';

// Configuration de moment en français
moment.locale('fr');
const localizer = momentLocalizer(moment);

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

  // Convertir les appointments vers le format requis par react-big-calendar
  const events = appointments.map(appointment => ({
    id: appointment.id,
    title: `${appointment.client?.first_name} ${appointment.client?.last_name}`,
    start: new Date(appointment.start_time),
    end: new Date(appointment.end_time),
    resource: appointment,
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
  const EventComponent = ({ event }: any) => {
    const appointment = event.resource as Appointment;
    const hasReport = appointment?.intervention_report_id;
    
    // Utiliser les initiales de l'intervenant s'il existe, sinon celles de l'utilisateur connecté
    const displayName = appointment?.intervenant 
      ? `${appointment.intervenant.first_name} ${appointment.intervenant.last_name}`
      : user?.email?.split('@')[0] || 'Auxiliaire';
    
    return (
      <div className="p-1">
        <div className="text-xs font-medium flex items-center gap-1 mb-1">
          <AuxiliaryAvatar 
            name={displayName} 
            size="sm" 
          />
          {hasReport && (
            <div className="bg-green-600 text-white rounded-full w-3 h-3 flex items-center justify-center">
              <FileText className="h-2 w-2" />
            </div>
          )}
        </div>
        <div className="text-xs">
          <div className="font-medium truncate">{event.title}</div>
          {appointment?.notes && (
            <div className="opacity-75 truncate">{appointment.notes}</div>
          )}
        </div>
      </div>
    );
  };

  // Composant pour l'agenda avec date complète
  const AgendaEventComponent = ({ event }: any) => {
    const appointment = event.resource as Appointment;
    const hasReport = appointment?.intervention_report_id;
    
    const displayName = appointment?.intervenant 
      ? `${appointment.intervenant.first_name} ${appointment.intervenant.last_name}`
      : user?.email?.split('@')[0] || 'Auxiliaire';
    
    return (
      <div className="flex items-center gap-3 p-2">
        <div className="flex items-center gap-2">
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
        <div className="flex-1">
          <div className="font-medium">{event.title}</div>
          {appointment?.notes && (
            <div className="text-sm text-gray-600">{appointment.notes}</div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0"
            onClick={(e) => handleEditClick(appointment, e)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0"
            onClick={(e) => handleDeleteClick(appointment, e)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {hasReport && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 bg-green-50 border-green-300"
              onClick={(e) => {
                e.stopPropagation();
                handleReportClick(appointment);
              }}
            >
              <FileText className="h-3 w-3 text-green-600" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Composant pour afficher la date dans l'agenda
  const AgendaDateComponent = ({ label }: any) => {
    return (
      <div className="font-medium text-sm p-2 bg-gray-50 border-b">
        {label}
      </div>
    );
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="week"
        step={30}
        showMultiDayTimes
        components={{
          event: EventComponent,
          agenda: {
            event: AgendaEventComponent,
            date: AgendaDateComponent,
          },
        }}
        messages={{
          allDay: 'Toute la journée',
          previous: 'Précédent',
          next: 'Suivant',
          today: "Aujourd'hui",
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
          agenda: 'Agenda',
          date: 'Date',
          time: 'Heure',
          event: 'Événement',
          noEventsInRange: 'Aucun rendez-vous dans cette période',
          showMore: (total) => `+ ${total} de plus`,
        }}
        formats={{
          dateFormat: 'DD',
          dayFormat: (date, culture, localizer) =>
            localizer?.format(date, 'dddd DD/MM', culture) ?? '',
          dayHeaderFormat: (date, culture, localizer) =>
            localizer?.format(date, 'dddd DD/MM', culture) ?? '',
          dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'DD/MM', culture)} - ${localizer?.format(end, 'DD/MM', culture)}`,
          agendaDateFormat: (date, culture, localizer) =>
            localizer?.format(date, 'dddd DD MMMM YYYY', culture) ?? '',
          agendaTimeFormat: (date, culture, localizer) =>
            localizer?.format(date, 'HH:mm', culture) ?? '',
          agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'HH:mm', culture)} - ${localizer?.format(end, 'HH:mm', culture)}`,
        }}
        onSelectEvent={(event) => {
          const appointment = event.resource as Appointment;
          if (appointment) {
            onAppointmentEdit(appointment);
          }
        }}
      />
    </div>
  );
};

export default AppointmentCalendar;
