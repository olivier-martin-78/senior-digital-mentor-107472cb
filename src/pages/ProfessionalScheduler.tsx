import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, UserCheck, Plus, FileDown, FileText, ClipboardList } from 'lucide-react';
import Header from '@/components/Header';
import AppointmentCalendar from '@/components/scheduler/AppointmentCalendar';
import AppointmentForm from '@/components/scheduler/AppointmentForm';
import ClientManager from '@/components/scheduler/ClientManager';
import IntervenantManager from '@/components/scheduler/IntervenantManager';
import AppointmentExporter from '@/components/scheduler/AppointmentExporter';
import InvoiceGenerator from '@/components/scheduler/InvoiceGenerator';
import { Appointment, Client, Intervenant } from '@/types/appointments';

const ProfessionalScheduler: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAppointments(),
        fetchClients(),
        fetchIntervenants()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      console.log('Récupération des rendez-vous pour utilisateur:', user?.id, 'email:', user?.email);
      
      // Récupérer les rendez-vous où l'utilisateur est le professionnel créateur
      const { data: professionalAppointments, error: professionalError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (*),
          intervenants (*)
        `)
        .eq('professional_id', user?.id)
        .order('start_time', { ascending: true });

      if (professionalError) {
        console.error('Erreur rendez-vous professionnel:', professionalError);
        throw professionalError;
      }

      console.log('Rendez-vous comme professionnel:', professionalAppointments?.length || 0);

      // Récupérer les rendez-vous où l'utilisateur est intervenant (par email)
      const { data: intervenantAppointments, error: intervenantError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (*),
          intervenants (*)
        `)
        .not('intervenant_id', 'is', null)
        .neq('professional_id', user?.id); // Éviter les doublons

      if (intervenantError) {
        console.error('Erreur rendez-vous intervenant:', intervenantError);
        throw intervenantError;
      }

      // Filtrer les rendez-vous où l'utilisateur est l'intervenant (par email)
      const userIntervenantAppointments = (intervenantAppointments || []).filter(appointment => {
        return appointment.intervenants?.email === user?.email;
      });

      console.log('Rendez-vous comme intervenant:', userIntervenantAppointments.length);

      // Combiner les deux listes
      const allAppointments = [
        ...(professionalAppointments || []),
        ...userIntervenantAppointments
      ];

      console.log('Total rendez-vous:', allAppointments.length);
      
      // Transformer les données pour correspondre au type Appointment
      const appointmentsWithCaregivers = allAppointments.map(appointment => ({
        ...appointment,
        status: appointment.status as 'scheduled' | 'completed' | 'cancelled',
        recurrence_type: appointment.recurrence_type as 'weekly' | 'monthly' | undefined,
        caregivers: [],
        client: appointment.clients,
        intervenant: appointment.intervenants
      }));
      
      setAppointments(appointmentsWithCaregivers);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les rendez-vous',
        variant: 'destructive'
      });
    }
  };

  const fetchClients = async () => {
    try {
      console.log('Récupération des clients pour utilisateur:', user?.id);
      
      // Récupérer les clients créés par l'utilisateur
      const { data: ownedClients, error: ownedError } = await supabase
        .from('clients')
        .select('*')
        .eq('created_by', user?.id)
        .order('first_name', { ascending: true });

      if (ownedError) {
        console.error('Erreur clients possédés:', ownedError);
        throw ownedError;
      }

      console.log('Clients possédés:', ownedClients?.length || 0);

      // Récupérer les clients partagés avec l'utilisateur
      const { data: sharedClientIds, error: sharedError } = await supabase
        .from('user_client_permissions')
        .select('client_id')
        .eq('user_id', user?.id);

      if (sharedError) {
        console.error('Erreur permissions clients:', sharedError);
        throw sharedError;
      }

      console.log('Permissions trouvées:', sharedClientIds?.length || 0);

      let sharedClients: any[] = [];
      
      if (sharedClientIds && sharedClientIds.length > 0) {
        const clientIds = sharedClientIds.map(permission => permission.client_id);
        
        const { data: sharedClientsData, error: sharedClientsError } = await supabase
          .from('clients')
          .select('*')
          .in('id', clientIds)
          .order('first_name', { ascending: true });

        if (sharedClientsError) {
          console.error('Erreur clients partagés:', sharedClientsError);
          throw sharedClientsError;
        }

        sharedClients = sharedClientsData || [];
        console.log('Clients partagés:', sharedClients.length);
      }

      // Combiner les clients possédés et partagés (éviter les doublons)
      const allClientIds = new Set();
      const allClients = [];

      // Ajouter les clients possédés
      for (const client of (ownedClients || [])) {
        if (!allClientIds.has(client.id)) {
          allClientIds.add(client.id);
          allClients.push(client);
        }
      }

      // Ajouter les clients partagés
      for (const client of sharedClients) {
        if (!allClientIds.has(client.id)) {
          allClientIds.add(client.id);
          allClients.push(client);
        }
      }

      console.log('Total clients:', allClients.length);
      setClients(allClients);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les clients',
        variant: 'destructive'
      });
    }
  };

  const fetchIntervenants = async () => {
    try {
      const { data, error } = await supabase
        .from('intervenants')
        .select('*')
        .eq('created_by', user?.id)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setIntervenants(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des intervenants:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les intervenants',
        variant: 'destructive'
      });
    }
  };

  const handleAppointmentEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const handleAppointmentDelete = async (appointmentId: string, deleteReport?: boolean) => {
    try {
      if (deleteReport) {
        const appointmentToDelete = appointments.find(a => a.id === appointmentId);
        if (appointmentToDelete?.intervention_report_id) {
          const { error: reportError } = await supabase
            .from('intervention_reports')
            .delete()
            .eq('id', appointmentToDelete.intervention_report_id);

          if (reportError) {
            console.error('Erreur lors de la suppression du rapport:', reportError);
          }
        }
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Rendez-vous supprimé avec succès'
      });

      fetchAppointments();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le rendez-vous',
        variant: 'destructive'
      });
    }
  };

  const handleFormClose = () => {
    setShowAppointmentForm(false);
    setSelectedAppointment(null);
    fetchAppointments();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Planning Professionnel
          </h1>
          <p className="text-gray-600">
            Gérez vos rendez-vous, clients et intervenants
          </p>
        </div>

        {/* Boutons d'action toujours visibles pour les professionnels */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            onClick={() => setShowAppointmentForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau rendez-vous
          </Button>
          
          <AppointmentExporter professionalId={user?.id || ''} />
          
          <InvoiceGenerator professionalId={user?.id || ''} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendrier
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Mes Rendez-vous
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="intervenants" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Intervenants
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card>
              <CardContent className="p-6">
                <AppointmentCalendar
                  appointments={appointments}
                  onAppointmentEdit={handleAppointmentEdit}
                  onAppointmentDelete={handleAppointmentDelete}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Liste des rendez-vous</h3>
                    <Button onClick={() => setShowAppointmentForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau rendez-vous
                    </Button>
                  </div>
                  
                  {appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
                      <p className="text-gray-500 mb-4">Commencez par créer votre premier rendez-vous.</p>
                      <Button onClick={() => setShowAppointmentForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un rendez-vous
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {appointments.map((appointment) => (
                        <Card key={appointment.id} className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">
                                {appointment.client?.first_name} {appointment.client?.last_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {new Date(appointment.start_time).toLocaleString('fr-FR')}
                              </p>
                              {appointment.intervenant && (
                                <p className="text-sm text-gray-500">
                                  Intervenant: {appointment.intervenant.first_name} {appointment.intervenant.last_name}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAppointmentEdit(appointment)}
                              >
                                Modifier
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <ClientManager clients={clients} onClientUpdate={fetchClients} />
          </TabsContent>

          <TabsContent value="intervenants">
            <IntervenantManager intervenants={intervenants} onIntervenantUpdate={fetchIntervenants} />
          </TabsContent>
        </Tabs>

        {showAppointmentForm && (
          <AppointmentForm
            appointment={selectedAppointment}
            onSave={handleFormClose}
            onCancel={handleFormClose}
            clients={clients}
            intervenants={intervenants}
          />
        )}
      </div>
    </div>
  );
};

export default ProfessionalScheduler;
