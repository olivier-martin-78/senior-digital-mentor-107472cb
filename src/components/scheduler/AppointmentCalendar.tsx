
import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Appointment, CalendarEvent } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuxiliaryAvatar from './AuxiliaryAvatar';
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
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const handleReportClick = (appointment: Appointment) => {
    if (appointment.intervention_report_id) {
      navigate(`/intervention-report?reportId=${appointment.intervention_report_id}`);
    }
  };

  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const appointment = event.resource;
    const hasReport = appointment?.intervention_report_id;
    const clientColor = appointment?.client?.color || '#3174ad';
    
    return (
      <div className="p-1">
        <div className="text-xs font-medium flex items-center gap-1 mb-1">
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: clientColor }}
            />
            {user && (
              <AuxiliaryAvatar 
                name={user.email?.split('@')[0] || 'Auxiliaire'} 
                size="sm" 
              />
            )}
          </div>
          {hasReport && (
            <div className="bg-green-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
              <FileText className="h-2.5 w-2.5" />
            </div>
          )}
        </div>
        <div className="text-xs mb-1">
          <div className="font-medium">{format(event.start, 'dd/MM/yyyy')}</div>
          <div>{event.title}</div>
        </div>
        {appointment?.notes && (
          <div className="text-xs opacity-75 mb-1">
            <div className="truncate">{appointment.notes}</div>
          </div>
        )}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 bg-white border-gray-300 hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              if (appointment) onAppointmentEdit(appointment);
            }}
          >
            <Edit className="h-3 w-3 text-gray-700" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 bg-white border-gray-300 hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              if (appointment) {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
                  onAppointmentDelete(appointment.id);
                }
              }
            }}
          >
            <Trash2 className="h-3 w-3 text-gray-700" />
          </Button>
          {hasReport && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 bg-green-50 border-green-300 hover:bg-green-100"
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

  const AgendaEvent = ({ event }: { event: CalendarEvent }) => {
    const appointment = event.resource;
    const hasReport = appointment?.intervention_report_id;
    const clientColor = appointment?.client?.color || '#3174ad';
    
    return (
      <div className="flex items-center gap-3 p-2 w-full">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: clientColor }}
          />
          {user && (
            <AuxiliaryAvatar 
              name={user.email?.split('@')[0] || 'Auxiliaire'} 
              size="md" 
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {event.title}
          </div>
          {appointment?.notes && (
            <div className="text-xs text-gray-500 mt-1 truncate">{appointment.notes}</div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => {
              if (appointment) onAppointmentEdit(appointment);
            }}
          >
            <Edit className="h-4 w-4 text-gray-700" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => {
              if (appointment) {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
                  onAppointmentDelete(appointment.id);
                }
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-gray-700" />
          </Button>
          {hasReport && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 bg-green-50"
              onClick={() => {
                if (appointment) handleReportClick(appointment);
              }}
            >
              <FileText className="h-4 w-4 text-green-600" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const getEventStyle = (event: CalendarEvent) => {
    const appointment = event.resource;
    const clientColor = appointment?.client?.color || '#3174ad';
    let backgroundColor = clientColor;
    
    if (appointment?.status === 'completed') {
      backgroundColor = '#10b981';
    } else if (appointment?.status === 'cancelled') {
      backgroundColor = '#ef4444';
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
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
          agendaDateFormat: (date) => format(date, 'dd/MM/yyyy'),
          agendaTimeFormat: (date) => format(date, 'HH:mm'),
        }}
        components={{
          event: EventComponent,
          agenda: {
            event: AgendaEvent,
            date: ({ date }) => {
              console.log('Date reçue dans agenda:', date, typeof date);
              
              // Essayer de convertir la date de manière plus permissive
              let validDate;
              
              try {
                // Si c'est déjà une date valide
                if (date instanceof Date && isValid(date)) {
                  validDate = date;
                } else {
                  // Essayer de créer une date
                  validDate = new Date(date);
                  if (!isValid(validDate)) {
                    // Si ça ne marche pas, essayer de parser différemment
                    validDate = new Date(String(date));
                  }
                }
                
                // Vérifier une dernière fois
                if (!isValid(validDate)) {
                  console.warn('Impossible de formatter la date:', date);
                  return <div className="text-sm font-medium">Date invalide</div>;
                }
                
                const formattedDate = format(validDate, 'dd/MM/yyyy');
                console.log('Date formatée:', formattedDate);
                
                return (
                  <div className="text-sm font-medium">
                    {formattedDate}
                  </div>
                );
              } catch (error) {
                console.error('Erreur lors du formatage de la date:', error, date);
                return <div className="text-sm font-medium">Erreur date</div>;
              }
            },
            time: ({ event }) => {
              // Vérifier que l'événement et ses propriétés existent
              if (!event || !event.start || !event.end) {
                console.error('Missing event or time properties in agenda:', event);
                return <div className="text-sm">-</div>;
              }
              
              // Convertir en objets Date si nécessaire
              let startDate = event.start instanceof Date ? event.start : new Date(event.start);
              let endDate = event.end instanceof Date ? event.end : new Date(event.end);
              
              // Vérifier la validité des dates
              if (!isValid(startDate) || !isValid(endDate)) {
                console.error('Invalid event times in agenda:', event);
                return <div className="text-sm">-</div>;
              }
              
              try {
                return (
                  <div className="text-sm">
                    {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                  </div>
                );
              } catch (error) {
                console.error('Error formatting time in agenda:', error, event);
                return <div className="text-sm">-</div>;
              }
            },
          },
        }}
        eventPropGetter={getEventStyle}
        step={30}
        showMultiDayTimes
      />
    </div>
  );
};

export default AppointmentCalendar;
