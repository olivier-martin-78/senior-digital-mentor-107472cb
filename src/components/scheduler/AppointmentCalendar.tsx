
import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment, CalendarEvent } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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
  const events: CalendarEvent[] = appointments.map(appointment => ({
    id: appointment.id,
    title: `${appointment.client?.first_name} ${appointment.client?.last_name}`,
    start: new Date(appointment.start_time),
    end: new Date(appointment.end_time),
    resource: appointment,
  }));

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.resource) {
      onAppointmentEdit(event.resource);
    }
  };

  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const appointment = event.resource;
    const hasReport = appointment?.intervention_report_id;
    
    return (
      <div className="p-1">
        <div className="text-xs font-medium flex items-center gap-1">
          {hasReport && (
            <div className="bg-green-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
              <FileText className="h-2.5 w-2.5" />
            </div>
          )}
          {event.title}
        </div>
        <div className="text-xs opacity-75">
          {appointment?.notes && (
            <div className="truncate">{appointment.notes}</div>
          )}
        </div>
        <div className="flex gap-1 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              if (appointment) onAppointmentEdit(appointment);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              if (appointment) {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
                  onAppointmentDelete(appointment.id);
                }
              }
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {hasReport && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: 'Rapport d\'intervention',
                  description: 'Un rapport d\'intervention existe pour ce rendez-vous',
                });
              }}
            >
              <FileText className="h-3 w-3 text-green-600" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const getEventStyle = (event: CalendarEvent) => {
    const appointment = event.resource;
    let backgroundColor = '#3174ad';
    
    if (appointment?.status === 'completed') {
      backgroundColor = '#10b981';
    } else if (appointment?.status === 'cancelled') {
      backgroundColor = '#ef4444';
    } else if (appointment?.intervention_report_id) {
      backgroundColor = '#059669';
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: appointment?.intervention_report_id ? '2px solid #065f46' : '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={handleSelectEvent}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="week"
        culture="fr"
        messages={{
          next: 'Suivant',
          previous: 'Précédent',
          today: 'Aujourd\'hui',
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
          agenda: 'Agenda',
          date: 'Date',
          time: 'Heure',
          event: 'Événement',
          noEventsInRange: 'Aucun rendez-vous dans cette période',
          allDay: 'Toute la journée',
        }}
        formats={{
          timeGutterFormat: 'HH:mm',
          eventTimeRangeFormat: ({ start, end }) => {
            return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
          },
          agendaTimeRangeFormat: ({ start, end }) => {
            return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
          },
        }}
        components={{
          event: EventComponent,
        }}
        eventPropGetter={getEventStyle}
        step={30}
        showMultiDayTimes
      />
    </div>
  );
};

export default AppointmentCalendar;
