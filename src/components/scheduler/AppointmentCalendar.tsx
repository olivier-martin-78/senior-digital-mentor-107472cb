
import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileText, Clock, CircleDot, XCircle } from 'lucide-react';
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

  // Fonction pour obtenir l'icône de statut avec fond blanc
  const getStatusIcon = (status: string) => {
    const iconClass = "h-7 w-7 p-0.5 rounded-full bg-white shadow-sm border";
    switch (status) {
      case 'completed':
        return <CircleDot className={`${iconClass} text-green-500 border-green-200`} />;
      case 'cancelled':
        return <XCircle className={`${iconClass} text-red-600 border-red-200`} />;
      case 'scheduled':
      default:
        return <Clock className={`${iconClass} text-blue-600 border-blue-200`} />;
    }
  };

  // Convertir les appointments vers le format requis par FullCalendar
  const events = appointments.map(appointment => ({
    id: appointment.id,
    title: `${appointment.client?.first_name} ${appointment.client?.last_name}`,
    start: appointment.start_time,
    end: appointment.end_time,
    backgroundColor: appointment.client?.color || '#3174ad',
    borderColor: appointment.client?.color || '#3174ad',
    textColor: '#ffffff',
    extendedProps: {
      appointment: appointment,
      hasReport: !!appointment.intervention_report_id,
      displayName: appointment?.intervenant 
        ? `${appointment.intervenant.first_name} ${appointment.intervenant.last_name}`
        : user?.email?.split('@')[0] || 'Auxiliaire',
      status: appointment.status
    }
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

  // Gestionnaire d'événements pour les clics sur les événements
  const handleEventClick = (clickInfo: any) => {
    const appointment = clickInfo.event.extendedProps.appointment;
    if (appointment) {
      onAppointmentEdit(appointment);
    }
  };

  // Rendu personnalisé pour le contenu des événements
  const renderEventContent = (eventInfo: any) => {
    const appointment = eventInfo.event.extendedProps.appointment;
    const hasReport = eventInfo.event.extendedProps.hasReport;
    const displayName = eventInfo.event.extendedProps.displayName;
    const status = eventInfo.event.extendedProps.status;

    return (
      <div className="p-1 w-full h-full">
        <div className="text-xs font-medium flex items-center gap-1 mb-1">
          <AuxiliaryAvatar 
            name={displayName} 
            size="sm" 
          />
          {getStatusIcon(status)}
          {hasReport && (
            <div className="bg-green-600 text-white rounded-full w-3 h-3 flex items-center justify-center">
              <FileText className="h-2 w-2" />
            </div>
          )}
        </div>
        <div className="text-xs">
          <div className="font-medium truncate">{eventInfo.event.title}</div>
          {appointment?.notes && (
            <div className="opacity-75 truncate text-xs">{appointment.notes}</div>
          )}
        </div>
        <div className="flex gap-1 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 bg-white/90 border-white/50 hover:bg-white"
            onClick={(e) => handleEditClick(appointment, e)}
          >
            <Edit className="h-7 w-7 text-gray-700" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 bg-white/90 border-white/50 hover:bg-white"
            onClick={(e) => handleDeleteClick(appointment, e)}
          >
            <Trash2 className="h-7 w-7 text-gray-700" />
          </Button>
          {hasReport && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 bg-green-50/90 border-green-300/50 hover:bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                handleReportClick(appointment);
              }}
            >
              <FileText className="h-7 w-7 text-green-600" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[600px]">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        events={events}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        height={600}
        locale="fr"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        weekends={true}
        editable={false}
        selectable={false}
        dayMaxEvents={true}
        buttonText={{
          today: "Aujourd'hui",
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
          list: 'Agenda'
        }}
        noEventsText="Aucun rendez-vous"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
      />
    </div>
  );
};

export default AppointmentCalendar;
