
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Plus, FileText, UserCheck } from 'lucide-react';
import { Client, Appointment, Intervenant, CalendarEvent } from '@/types/appointments';
import AppointmentCalendar from '@/components/scheduler/AppointmentCalendar';
import ClientManager from '@/components/scheduler/ClientManager';
import IntervenantManager from '@/components/scheduler/IntervenantManager';
import AppointmentForm from '@/components/scheduler/AppointmentForm';
import AppointmentExporter from '@/components/scheduler/AppointmentExporter';

const ProfessionalScheduler = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'clients' | 'intervenants'>('calendar');

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('professionnel')) {
      navigate('/unauthorized');
      return;
    }
    
    loadData();
  }, [hasRole, navigate, user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await Promise.all([loadAppointments(), loadClients(), loadIntervenants()]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (
          id,
          first_name,
          last_name,
          address,
          phone,
          email,
          color,
          hourly_rate,
          created_at,
          updated_at,
          created_by
        ),
        intervenants:intervenant_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          speciality,
          active,
          created_at,
          updated_at,
          created_by
        )
      `)
      .eq('professional_id', user.id)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      throw error;
    }

    // Transformer les données pour correspondre au type Appointment
    const transformedData = (data || []).map(item => ({
      ...item,
      status: item.status as 'scheduled' | 'completed' | 'cancelled',
      recurrence_type: item.recurrence_type as 'weekly' | 'monthly' | undefined,
      client: item.clients,
      intervenant: item.intervenants,
      caregivers: []
    }));

    setAppointments(transformedData);
  };

  const loadClients = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('created_by', user.id)
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Erreur lors du chargement des clients:', error);
      throw error;
    }

    setClients(data || []);
  };

  const loadIntervenants = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('intervenants')
      .select('*')
      .eq('created_by', user.id)
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Erreur lors du chargement des intervenants:', error);
      throw error;
    }

    setIntervenants(data || []);
  };

  const handleAppointmentSave = () => {
    loadAppointments();
    setShowAppointmentForm(false);
    setSelectedAppointment(null);
  };

  const handleAppointmentEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const handleAppointmentDelete = async (appointmentId: string) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le rendez-vous',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Succès',
      description: 'Rendez-vous supprimé avec succès',
    });

    loadAppointments();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Planificateur Professionnel</h1>
          <div className="flex gap-3">
            <AppointmentExporter professionalId={user?.id || ''} />
            <Button 
              onClick={() => navigate('/intervention-report')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Nouvelle intervention
            </Button>
            <Button 
              onClick={() => setShowAppointmentForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouveau rendez-vous
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'calendar' ? 'default' : 'outline'}
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Calendrier
          </Button>
          <Button
            variant={activeTab === 'clients' ? 'default' : 'outline'}
            onClick={() => setActiveTab('clients')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Clients
          </Button>
          <Button
            variant={activeTab === 'intervenants' ? 'default' : 'outline'}
            onClick={() => setActiveTab('intervenants')}
            className="flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Intervenants
          </Button>
        </div>

        {activeTab === 'calendar' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Planning des rendez-vous
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentCalendar
                appointments={appointments}
                onAppointmentEdit={handleAppointmentEdit}
                onAppointmentDelete={handleAppointmentDelete}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'clients' && (
          <ClientManager 
            clients={clients}
            onClientUpdate={loadClients}
          />
        )}

        {activeTab === 'intervenants' && (
          <IntervenantManager 
            intervenants={intervenants}
            onIntervenantUpdate={loadIntervenants}
          />
        )}

        {showAppointmentForm && (
          <AppointmentForm
            appointment={selectedAppointment}
            clients={clients}
            intervenants={intervenants}
            onSave={handleAppointmentSave}
            onCancel={() => {
              setShowAppointmentForm(false);
              setSelectedAppointment(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProfessionalScheduler;
