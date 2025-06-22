import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AppointmentForm from '@/components/scheduler/AppointmentForm';
import AppointmentCalendar from '@/components/scheduler/AppointmentCalendar';
import SchedulerFilters from '@/components/scheduler/SchedulerFilters';
import ClientManager from '@/components/scheduler/ClientManager';
import IntervenantManager from '@/components/scheduler/IntervenantManager';
import CaregiverManager from '@/components/scheduler/CaregiverManager';
import AppointmentExporter from '@/components/scheduler/AppointmentExporter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Appointment, Client, Intervenant, Caregiver } from '@/types/appointments';
import { CalendarDays, Users, UserCheck, Phone, Plus, Download } from 'lucide-react';

const ProfessionalScheduler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [filterClientId, setFilterClientId] = useState<string | null>(null);
  const [filterIntervenantId, setFilterIntervenantId] = useState<string | null>(null);
  const [filterCaregiverId, setFilterCaregiverId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          clients (*),
          intervenants (*),
          caregivers (*)
        `)
        .eq('professional_id', user?.id)
        .order('start_time', { ascending: true });

      if (appointmentsError) {
        throw appointmentsError;
      }

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('professional_id', user?.id)
        .order('last_name', { ascending: true });

      if (clientsError) {
        throw clientsError;
      }

      const { data: intervenantsData, error: intervenantsError } = await supabase
        .from('intervenants')
        .select('*')
        .eq('professional_id', user?.id)
        .order('last_name', { ascending: true });

      if (intervenantsError) {
        throw intervenantsError;
      }

      const { data: caregiversData, error: caregiversError } = await supabase
        .from('caregivers')
        .select('*')
        .eq('professional_id', user?.id)
        .order('last_name', { ascending: true });

      if (caregiversError) {
        throw caregiversError;
      }

      setAppointments(appointmentsData || []);
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

    if (filterCaregiverId) {
      filtered = filtered.filter(appointment => appointment.caregiver_id === filterCaregiverId);
    }

    if (filterStatus) {
      filtered = filtered.filter(appointment => appointment.status === filterStatus);
    }

    return filtered;
  }, [appointments, filterClientId, filterIntervenantId, filterCaregiverId, filterStatus]);

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

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentFormOpen(true);
  };

  const handleSaveAppointment = () => {
    fetchData();
    handleCloseAppointmentForm();
  };

  const handleOpenClientManager = () => {
    setIsClientManagerOpen(true);
  };

  const handleCloseClientManager = () => {
    setIsClientManagerOpen(false);
    fetchData();
  };

  const handleOpenIntervenantManager = () => {
    setIsIntervenantManagerOpen(true);
  };

  const handleCloseIntervenantManager = () => {
    setIsIntervenantManagerOpen(false);
    fetchData();
  };

  const handleOpenCaregiverManager = () => {
    setIsCaregiverManagerOpen(true);
  };

  const handleCloseCaregiverManager = () => {
    setIsCaregiverManagerOpen(false);
    fetchData();
  };

  const handleClearFilters = () => {
    setFilterClientId(null);
    setFilterIntervenantId(null);
    setFilterCaregiverId(null);
    setFilterStatus(null);
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

        <Tabs defaultValue="calendar" className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-tranches-mauve/50">
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendrier
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
                  caregivers={caregivers}
                  filterClientId={filterClientId}
                  setFilterClientId={setFilterClientId}
                  filterIntervenantId={filterIntervenantId}
                  setFilterIntervenantId={setFilterIntervenantId}
                  filterCaregiverId={filterCaregiverId}
                  setFilterCaregiverId={setFilterCaregiverId}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  onClearFilters={handleClearFilters}
                />
                <AppointmentCalendar
                  appointments={filteredAppointments}
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  onAppointmentClick={handleAppointmentClick}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="managers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Users className="w-4 h-4" />
                    Aidants
                  </CardTitle>
                  <CardDescription>Gérez vos aidants.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleOpenCaregiverManager} className="w-full">
                    Gérer les Aidants
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Exporter les Rendez-vous</CardTitle>
                <CardDescription>Exportez vos rendez-vous au format CSV.</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentExporter appointments={appointments} />
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
            isOpen={isClientManagerOpen}
            onClose={handleCloseClientManager}
            clients={clients}
            setClients={setClients}
          />
        )}

        {isIntervenantManagerOpen && (
          <IntervenantManager
            isOpen={isIntervenantManagerOpen}
            onClose={handleCloseIntervenantManager}
            intervenants={intervenants}
            setIntervenants={setIntervenants}
          />
        )}

        {isCaregiverManagerOpen && (
          <CaregiverManager
            isOpen={isCaregiverManagerOpen}
            onClose={handleCloseCaregiverManager}
            caregivers={caregivers}
            setCaregivers={setCaregivers}
          />
        )}
      </div>
    </div>
  );
};

export default ProfessionalScheduler;
