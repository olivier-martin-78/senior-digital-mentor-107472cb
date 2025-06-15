import React, { useState, useCallback } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Appointment, CalendarEvent } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, FileText, Plus, User, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppointmentDeleteDialog from './AppointmentDeleteDialog';
import AuxiliaryAvatar from './AuxiliaryAvatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// CORRECTION : Configuration complète de moment en français
moment.locale('fr', {
  months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split('_'),
  monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split('_'),
  weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
  weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
  weekdaysMin: 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
});

// Forcer la locale française globalement
moment.locale('fr');
const localizer = momentLocalizer(moment);

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAppointmentEdit: (appointment: Appointment) => void;
  onAppointmentDelete: (appointmentId: string, deleteReport?: boolean) => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  onAppointmentEdit,
  onAppointmentDelete
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentView, setCurrentView] = useState<View>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const events: CalendarEvent[] = appointments.map((appointment) => {
    // Créer le titre avec le nom du client et un avatar pour l'intervenant
    let title = `${appointment.client?.first_name} ${appointment.client?.last_name}`;
    
    if (appointment.intervenant) {
      const intervenantName = `${appointment.intervenant.first_name} ${appointment.intervenant.last_name}`;
      title += ` - ${intervenantName}`;
    }

    return {
      id: appointment.id,
      title,
      start: new Date(appointment.start_time),
      end: new Date(appointment.end_time),
      resource: appointment,
    };
  });

  // Composant personnalisé pour l'affichage des événements
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const appointment = event.resource;
    const clientName = `${appointment?.client?.first_name} ${appointment?.client?.last_name}`;
    
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="truncate flex-1">{clientName}</span>
        {appointment?.intervenant && (
          <AuxiliaryAvatar 
            name={`${appointment.intervenant.first_name} ${appointment.intervenant.last_name}`}
            size="sm"
          />
        )}
      </div>
    );
  };

  // CORRECTION : Composant pour la colonne Date - utiliser directement l'objet Date sans moment
  const AgendaDate = ({ event }: { event: CalendarEvent }) => {
    // L'événement contient déjà un objet Date, pas besoin de le parser avec moment
    const eventDate = new Date(event.start).toLocaleDateString('fr-FR');
    return (
      <div className="text-sm font-medium text-gray-600 min-w-[80px]">
        {eventDate}
      </div>
    );
  };

  // CORRECTION : Composant pour la colonne Heure - utiliser directement l'objet Date
  const AgendaTime = ({ event }: { event: CalendarEvent }) => {
    const startTime = new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(event.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="text-sm text-gray-700 min-w-[100px]">
        {startTime} - {endTime}
      </div>
    );
  };

  // Composant pour la colonne Event - affiche seulement le client, notes et initiales
  const AgendaEvent = ({ event }: { event: CalendarEvent }) => {
    const appointment = event.resource;
    const clientName = `${appointment?.client?.first_name} ${appointment?.client?.last_name}`;
    
    // Initiales de l'intervenant
    const intervenantInitials = appointment?.intervenant 
      ? `${appointment.intervenant.first_name.charAt(0)}${appointment.intervenant.last_name.charAt(0)}`
      : null;
    
    return (
      <div className="flex items-center justify-between w-full py-2">
        <div className="flex-1">
          <span className="font-medium text-gray-900">{clientName}</span>
          {appointment?.notes && (
            <div className="text-xs text-gray-600 italic mt-1">
              {appointment.notes}
            </div>
          )}
        </div>
        
        {/* Initiales de l'intervenant alignées à droite */}
        {intervenantInitials && (
          <div className="ml-4">
            <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full min-w-[32px] text-center">
              {intervenantInitials}
            </div>
          </div>
        )}
      </div>
    );
  };

  // CORRECTION : Composant personnalisé pour la toolbar avec format français
  const CustomToolbar = ({ label, onNavigate, onView, view }: any) => {
    // CORRECTION : Pour la vue agenda, reconstruire le label en français
    let frenchLabel = label;
    if (view === 'agenda') {
      // Extraire les dates de début et fin depuis le label
      const parts = label.split(' – ');
      if (parts.length === 2) {
        // Parser les dates anglaises et les reformater en français
        const startDate = new Date(parts[0]);
        const endDate = new Date(parts[1]);
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const startFormatted = startDate.toLocaleDateString('fr-FR');
          const endFormatted = endDate.toLocaleDateString('fr-FR');
          frenchLabel = `${startFormatted} – ${endFormatted}`;
        }
      }
    }
    
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => onNavigate('TODAY')}>
            Aujourd'hui
          </button>
          <button type="button" onClick={() => onNavigate('PREV')}>
            Précédent
          </button>
          <button type="button" onClick={() => onNavigate('NEXT')}>
            Suivant
          </button>
        </span>
        <span className="rbc-toolbar-label">{frenchLabel}</span>
        <span className="rbc-btn-group">
          <button type="button" className={view === 'month' ? 'rbc-active' : ''} onClick={() => onView('month')}>
            Mois
          </button>
          <button type="button" className={view === 'week' ? 'rbc-active' : ''} onClick={() => onView('week')}>
            Semaine
          </button>
          <button type="button" className={view === 'day' ? 'rbc-active' : ''} onClick={() => onView('day')}>
            Jour
          </button>
          <button type="button" className={view === 'agenda' ? 'rbc-active' : ''} onClick={() => onView('agenda')}>
            Agenda
          </button>
        </span>
      </div>
    );
  };

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
  }, []);

  const handleCreateReport = () => {
    if (selectedAppointment) {
      // Naviguer vers la page de création de rapport avec l'ID du rendez-vous
      navigate(`/intervention-report?appointment_id=${selectedAppointment.id}`);
    }
  };

  const handleViewReport = () => {
    if (selectedAppointment?.intervention_report_id) {
      // Naviguer vers la page de visualisation du rapport
      navigate(`/intervention-report?report_id=${selectedAppointment.intervention_report_id}`);
    }
  };

  const handleEdit = () => {
    if (selectedAppointment) {
      onAppointmentEdit(selectedAppointment);
      setSelectedAppointment(null);
    }
  };

  const handleDelete = () => {
    if (selectedAppointment) {
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = (appointmentId: string, deleteReport?: boolean) => {
    onAppointmentDelete(appointmentId, deleteReport);
    setSelectedAppointment(null);
    setShowDeleteDialog(false);
  };

  // Fonction pour déterminer si l'utilisateur peut modifier le rendez-vous
  const canEditAppointment = (appointment: Appointment) => {
    if (!user) return false;
    
    // L'utilisateur peut modifier s'il est le créateur
    if (appointment.professional_id === user.id) return true;
    
    // L'utilisateur peut modifier s'il est l'intervenant avec le même email
    if (appointment.intervenant?.email === user.email) return true;
    
    return false;
  };

  // Fonction pour déterminer si l'utilisateur peut supprimer le rendez-vous
  const canDeleteAppointment = (appointment: Appointment) => {
    if (!user) return false;
    
    // Seul le créateur peut supprimer
    return appointment.professional_id === user.id;
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const appointment = event.resource;
    let backgroundColor = appointment.client?.color || '#3174ad';
    
    // Ajuster la couleur selon le statut
    if (appointment.status === 'cancelled') {
      backgroundColor = '#ef4444';
    } else if (appointment.status === 'completed') {
      backgroundColor = '#22c55e';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
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

  const formats = {
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
      return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
    },
    // CORRECTION : Forcer les jours en français dans la vue semaine avec locale explicite
    dayFormat: (date: Date) => moment(date).locale('fr').format('dddd DD/MM'),
    dayHeaderFormat: (date: Date) => moment(date).locale('fr').format('dddd DD/MM'),
    // CORRECTION : Formats simplifiés pour éviter les erreurs de parsing
    agendaDateFormat: (date: Date) => new Date(date).toLocaleDateString('fr-FR'),
    agendaTimeFormat: (date: Date) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
      const startTime = new Date(start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return `${startTime} - ${endTime}`;
    },
  };

  return (
    <div className="space-y-4">
      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
            toolbar: CustomToolbar,
            agenda: {
              event: AgendaEvent, // Seulement client, notes et initiales
              date: AgendaDate,   // Date dans la première colonne
              time: AgendaTime,   // Heures dans la deuxième colonne
            }
          }}
          messages={messages}
          formats={formats}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          views={['month', 'week', 'day', 'agenda']}
          step={15}
          timeslots={4}
          min={new Date(2024, 0, 1, 7, 0)}
          max={new Date(2024, 0, 1, 22, 0)}
          className="bg-white rounded-lg border"
          showAllEvents={true}
        />
      </div>

      {selectedAppointment && (
        <Card className="border-l-4" style={{ borderLeftColor: selectedAppointment.client?.color || '#3174ad' }}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {selectedAppointment.client?.first_name} {selectedAppointment.client?.last_name}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {moment(selectedAppointment.start_time).format('DD/MM/YYYY HH:mm')} - {moment(selectedAppointment.end_time).format('HH:mm')}
                  </div>
                  
                  {selectedAppointment.intervenant && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedAppointment.intervenant.first_name} {selectedAppointment.intervenant.last_name}
                    </div>
                  )}
                  
                  {selectedAppointment.client?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedAppointment.client.address}
                    </div>
                  )}
                </div>

                {selectedAppointment.notes && (
                  <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                    {selectedAppointment.notes}
                  </p>
                )}

                <div className="mt-3">
                  <Badge variant={
                    selectedAppointment.status === 'completed' ? 'default' :
                    selectedAppointment.status === 'cancelled' ? 'destructive' : 
                    'secondary'
                  }>
                    {selectedAppointment.status === 'completed' ? 'Terminé' :
                     selectedAppointment.status === 'cancelled' ? 'Annulé' : 
                     'Planifié'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canEditAppointment(selectedAppointment) && (
                <Button onClick={handleEdit} size="sm" variant="outline" className="flex items-center gap-1">
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              )}
              
              {canDeleteAppointment(selectedAppointment) && (
                <Button onClick={handleDelete} size="sm" variant="outline" className="flex items-center gap-1 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              )}

              {/* Boutons pour les rapports d'intervention */}
              {selectedAppointment.intervention_report_id ? (
                <Button onClick={handleViewReport} size="sm" variant="outline" className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                  <FileText className="h-4 w-4" />
                  Voir le rapport
                </Button>
              ) : (
                <Button onClick={handleCreateReport} size="sm" variant="outline" className="flex items-center gap-1 text-green-600 hover:text-green-700">
                  <Plus className="h-4 w-4" />
                  Créer un rapport
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showDeleteDialog && selectedAppointment && (
        <AppointmentDeleteDialog
          appointment={selectedAppointment}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar;
