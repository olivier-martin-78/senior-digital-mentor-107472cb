
import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment, CalendarEvent } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.client?.first_name} ${appointment.client?.last_name}`,
      start: new Date(appointment.start_time),
      end: new Date(appointment.end_time),
      resource: appointment,
    }));
  }, [appointments]);

  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const appointment = event.resource;
    if (!appointment) return null;

    return (
      <div className="text-xs">
        <div className="font-medium">{event.title}</div>
        <div className="text-gray-600">
          {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
        </div>
        {appointment.notes && (
          <div className="text-gray-500 truncate">{appointment.notes}</div>
        )}
      </div>
    );
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.resource) {
      onAppointmentEdit(event.resource);
    }
  };

  const messages = {
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
    showMore: (total: number) => `+ ${total} de plus`,
  };

  return (
    <div className="space-y-4">
      <div className="h-96">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="fr"
          messages={messages}
          onSelectEvent={handleSelectEvent}
          components={{
            event: EventComponent,
          }}
          style={{ height: '100%' }}
          views={['month', 'week', 'day']}
          defaultView="week"
          step={30}
          timeslots={2}
          min={new Date(2024, 0, 1, 7, 0, 0)}
          max={new Date(2024, 0, 1, 20, 0, 0)}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Prochains rendez-vous</h3>
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {appointments
            .filter(apt => new Date(apt.start_time) >= new Date())
            .slice(0, 5)
            .map(appointment => (
              <Card key={appointment.id} className="p-3">
                <CardContent className="p-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {appointment.client?.first_name} {appointment.client?.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(appointment.start_time), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                      </div>
                      {appointment.notes && (
                        <div className="text-sm text-gray-500 mt-1">{appointment.notes}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAppointmentEdit(appointment)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAppointmentDelete(appointment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
