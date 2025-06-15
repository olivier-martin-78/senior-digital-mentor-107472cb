
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
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (*),
          intervenants (*)
        `)
        .eq('professional_id', user?.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('created_by', user?.id)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
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
          
          <AppointmentExporter 
            appointments={appointments}
            clients={clients}
            intervenants={intervenants}
          />
          
          <InvoiceGenerator 
            appointments={appointments}
            clients={clients}
            intervenants={intervenants}
          />
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
            onClose={handleFormClose}
            clients={clients}
            intervenants={intervenants}
          />
        )}
      </div>
    </div>
  );
};

export default ProfessionalScheduler;
