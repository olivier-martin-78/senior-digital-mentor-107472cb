import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AppointmentForm from '@/components/scheduler/AppointmentForm';
import AppointmentCalendar from '@/components/scheduler/AppointmentCalendar';
import SchedulerFilters from '@/components/scheduler/SchedulerFilters';
import ClientManager from '@/components/scheduler/ClientManager';
import IntervenantManager from '@/components/scheduler/IntervenantManager';
import CaregiverManager from '@/components/scheduler/CaregiverManager';
import AppointmentExporter from '@/components/scheduler/AppointmentExporter';
import MyAppointments from '@/components/scheduler/MyAppointments';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Appointment, Client, Intervenant, Caregiver } from '@/types/appointments';
import { CalendarDays, Users, UserCheck, Phone, Plus, Download, Clock, Star } from 'lucide-react';
import { ReviewRequestForm } from '@/components/review/ReviewRequestForm';

const ProfessionalScheduler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isClientManagerOpen, setIsClientManagerOpen] = useState(false);
  const [isIntervenantManagerOpen, setIsIntervenantManagerOpen] = useState(false);
  const [isCaregiverManagerOpen, setIsCaregiverManagerOpen] = useState(false);
  const [isReviewRequestFormOpen, setIsReviewRequestFormOpen] = useState(false);
  const [filterClientId, setFilterClientId] = useState<string | null>(null);
  const [filterIntervenantId, setFilterIntervenantId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClientForCaregivers, setSelectedClientForCaregivers] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients!appointments_client_id_fkey (*),
          intervenant:intervenants!appointments_intervenant_id_fkey (*)
        `)
        .eq('professional_id', user?.id)
        .order('start_time', { ascending: true });

      if (appointmentsError) {
        throw appointmentsError;
      }

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('created_by', user?.id)
        .order('last_name', { ascending: true });

      if (clientsError) {
        throw clientsError;
      }

      const { data: intervenantsData, error: intervenantsError } = await supabase
        .from('intervenants')
        .select('*')
        .eq('created_by', user?.id)
        .order('last_name', { ascending: true });

      if (intervenantsError) {
        throw intervenantsError;
      }

      const { data: caregiversData, error: caregiversError } = await supabase
        .from('caregivers')
        .select('*')
        .order('last_name', { ascending: true });

      if (caregiversError) {
        throw caregiversError;
      }

      // Transform appointments data to match our types with proper type casting
      const transformedAppointments: Appointment[] = (appointmentsData || []).map(appointment => ({
        ...appointment,
        status: appointment.status as 'scheduled' | 'completed' | 'cancelled',
        recurrence_type: appointment.recurrence_type as 'weekly' | 'monthly' | undefined,
        caregivers: caregiversData?.filter(cg => cg.client_id === appointment.client_id) || []
      }));

      console.log('Fetched appointments with relations:', transformedAppointments);

      setAppointments(transformedAppointments);
      setClients(clientsData || []);
      setIntervenants(intervenantsData || []);
      setCaregivers(caregiversData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    if (filterClientId) {
      filtered = filtered.filter(appointment => appointment.client_id === filterClientId);
    }

    if (filterIntervenantId) {
      filtered = filtered.filter(appointment => appointment.intervenant_id === filterIntervenantId);
    }

    if (filterStatus) {
      filtered = filtered.filter(appointment => appointment.status === filterStatus);
    }

    return filtered;
  }, [appointments, filterClientId, filterIntervenantId, filterStatus]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleOpenAppointmentForm = () => {
    setSelectedAppointment(null);
    setIsAppointmentFormOpen(true);
  };

  const handleCloseAppointmentForm = () => {
    setIsAppointmentFormOpen(false);
    setSelectedAppointment(null);
  };

  const handleAppointmentEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentFormOpen(true);
  };

  const handleAppointmentDelete = async (appointmentId: string, deleteReport?: boolean) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Rendez-vous supprimé avec succès',
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le rendez-vous',
        variant: 'destructive',
      });
    }
  };

  const handleSaveAppointment = () => {
    fetchData();
    handleCloseAppointmentForm();
  };

  const handleOpenClientManager = () => {
    // Fermer les autres modals avant d'ouvrir celui-ci
    setIsIntervenantManagerOpen(false);
    setIsCaregiverManagerOpen(false);
    setIsClientManagerOpen(true);
  };

  const handleCloseClientManager = () => {
    setIsClientManagerOpen(false);
    fetchData();
  };

  const handleOpenIntervenantManager = () => {
    // Fermer les autres modals avant d'ouvrir celui-ci
    setIsClientManagerOpen(false);
    setIsCaregiverManagerOpen(false);
    setIsIntervenantManagerOpen(true);
  };

  const handleCloseIntervenantManager = () => {
    setIsIntervenantManagerOpen(false);
    fetchData();
  };

  const handleOpenCaregiverManager = () => {
    // For demo purposes, we'll use the first client if available
    const firstClient = clients[0];
    if (firstClient) {
      setSelectedClientForCaregivers(firstClient.id);
      setIsCaregiverManagerOpen(true);
    } else {
      toast({
        title: 'Erreur',
        description: 'Veuillez d\'abord créer un client pour gérer les aidants',
        variant: 'destructive',
      });
    }
  };

  const handleCloseCaregiverManager = () => {
    setIsCaregiverManagerOpen(false);
    setSelectedClientForCaregivers(null);
    fetchData();
  };

  const handleClearFilters = () => {
    setFilterClientId(null);
    setFilterIntervenantId(null);
    setFilterStatus(null);
  };

  const handleOpenReviewRequestForm = () => {
    setIsReviewRequestFormOpen(true);
  };

  const handleCloseReviewRequestForm = () => {
    setIsReviewRequestFormOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif text-tranches-charcoal">
            Planificateur Professionnel
          </h1>
          <Button onClick={handleOpenAppointmentForm} className="bg-tranches-sage hover:bg-tranches-sage/90">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Rendez-vous
          </Button>
        </div>

        <Tabs defaultValue={searchParams.get('tab') || 'calendar'} className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-tranches-mauve/50">
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendrier
            </TabsTrigger>
            <TabsTrigger value="my-appointments" className="data-[state=active]:bg-tranches-mauve/50">
              <Clock className="w-4 h-4 mr-2" />
              Mes rendez-vous
            </TabsTrigger>
            <TabsTrigger value="managers" className="data-[state=active]:bg-tranches-mauve/50">
              <Users className="w-4 h-4 mr-2" />
              Gestion des contacts
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-tranches-mauve/50">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calendrier des Rendez-vous</CardTitle>
                <CardDescription>Visualisez et gérez vos rendez-vous.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <SchedulerFilters
                  clients={clients}
                  intervenants={intervenants}
                  selectedClientId={filterClientId}
                  selectedIntervenantId={filterIntervenantId}
                  onClientChange={setFilterClientId}
                  onIntervenantChange={setFilterIntervenantId}
                />
                <AppointmentCalendar
                  appointments={filteredAppointments}
                  onAppointmentEdit={handleAppointmentEdit}
                  onAppointmentDelete={handleAppointmentDelete}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="my-appointments">
            <MyAppointments
              appointments={filteredAppointments}
              onAppointmentEdit={handleAppointmentEdit}
              defaultTab={searchParams.get('subtab') === 'completed' ? 'completed' : 'scheduled'}
            />
          </TabsContent>
          
          <TabsContent value="managers">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Clients
                  </CardTitle>
                  <CardDescription>Gérez vos clients.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleOpenClientManager} className="w-full">
                    Gérer les Clients
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Intervenants
                  </CardTitle>
                  <CardDescription>Gérez vos intervenants.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleOpenIntervenantManager} className="w-full">
                    Gérer les Intervenants
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Gestion des avis clients
                  </CardTitle>
                  <CardDescription>Sollicitez des avis de vos clients.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleOpenReviewRequestForm} className="w-full">
                    Solliciter un avis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Exporter les Rendez-vous</CardTitle>
                <CardDescription>Choisissez le mois et l'année puis exportez vos rendez-vous au format Excel.</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentExporter professionalId={user?.id || ''} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isAppointmentFormOpen && (
          <AppointmentForm
            appointment={selectedAppointment}
            clients={clients}
            intervenants={intervenants}
            onSave={handleSaveAppointment}
            onCancel={handleCloseAppointmentForm}
          />
        )}

        {isClientManagerOpen && (
          <ClientManager
            clients={clients}
            onClientUpdate={handleCloseClientManager}
          />
        )}

        {isIntervenantManagerOpen && (
          <IntervenantManager
            intervenants={intervenants}
            onIntervenantUpdate={handleCloseIntervenantManager}
          />
        )}

        {isCaregiverManagerOpen && selectedClientForCaregivers && (
          <CaregiverManager 
            clientId={selectedClientForCaregivers}
          />
        )}

        <ReviewRequestForm
          isOpen={isReviewRequestFormOpen}
          onClose={handleCloseReviewRequestForm}
        />
      </div>
    </div>
  );
};

export default ProfessionalScheduler;
