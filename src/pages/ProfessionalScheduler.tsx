import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Plus, UserCheck } from 'lucide-react';
import { Client, Appointment, Intervenant, CalendarEvent } from '@/types/appointments';
import AppointmentCalendar from '@/components/scheduler/AppointmentCalendar';
import ClientManager from '@/components/scheduler/ClientManager';
import IntervenantManager from '@/components/scheduler/IntervenantManager';
import AppointmentForm from '@/components/scheduler/AppointmentForm';
import AppointmentExporter from '@/components/scheduler/AppointmentExporter';
import InvoiceGenerator from '@/components/scheduler/InvoiceGenerator';
import SchedulerFilters from '@/components/scheduler/SchedulerFilters';
import ActionMenu from '@/components/scheduler/ActionMenu';

const ProfessionalScheduler = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'clients' | 'intervenants'>('calendar');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedIntervenantId, setSelectedIntervenantId] = useState<string | null>(null);
  const [currentIntervenantId, setCurrentIntervenantId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('professionnel')) {
      navigate('/unauthorized');
      return;
    }
    
    loadData();
  }, [hasRole, navigate, user]);

  useEffect(() => {
    // Filtrer les rendez-vous selon les sélections
    let filtered = appointments;

    if (selectedClientId) {
      filtered = filtered.filter(appointment => appointment.client_id === selectedClientId);
    }

    if (selectedIntervenantId) {
      filtered = filtered.filter(appointment => appointment.intervenant_id === selectedIntervenantId);
    }

    setFilteredAppointments(filtered);
  }, [appointments, selectedClientId, selectedIntervenantId]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Identifier si l'utilisateur connecté est un intervenant
      console.log('🔍 SCHEDULER - Email utilisateur connecté:', user.email);
      
      // Chercher d'abord par email exact
      let { data: intervenantDataByEmail } = await supabase
        .from('intervenants')
        .select('id, first_name, last_name, email')
        .eq('email', user.email)
        .maybeSingle();

      let currentIntervenantIdFound = intervenantDataByEmail?.id || null;
      
      console.log('🔍 SCHEDULER - Intervenant trouvé par email:', intervenantDataByEmail);

      // Si pas trouvé par email, chercher par nom/prénom dans le profil
      if (!currentIntervenantIdFound) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();

        console.log('🔍 SCHEDULER - Profil utilisateur:', profileData);

        if (profileData?.display_name) {
          const nameParts = profileData.display_name.split(' ');
          if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            
            console.log('🔍 SCHEDULER - Recherche par nom:', firstName, lastName);
            
            const { data: intervenantDataByName } = await supabase
              .from('intervenants')
              .select('id, first_name, last_name, email')
              .eq('first_name', firstName)
              .eq('last_name', lastName)
              .maybeSingle();

            console.log('🔍 SCHEDULER - Intervenant trouvé par nom:', intervenantDataByName);
            currentIntervenantIdFound = intervenantDataByName?.id || null;
          }
        }
      }

      if (currentIntervenantIdFound) {
        setCurrentIntervenantId(currentIntervenantIdFound);
        console.log('🔍 SCHEDULER - Utilisateur est un intervenant:', currentIntervenantIdFound);
      } else {
        console.log('🔍 SCHEDULER - Utilisateur n\'est pas un intervenant identifié');
      }

      await Promise.all([
        loadAppointments(), 
        loadClients(), 
        loadIntervenants()
      ]);
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

    console.log('🔍 SCHEDULER - Chargement des rendez-vous avec RLS strict...');
    console.log('🔍 SCHEDULER - User ID:', user.id);
    console.log('🔍 SCHEDULER - User Email:', user.email);

    // DIAGNOSTIC: Test direct pour comprendre pourquoi les politiques RLS ne fonctionnent pas
    const { data: diagnosticData, error: diagnosticError } = await supabase
      .from('appointments')
      .select('id, professional_id, intervenant_id')
      .limit(5);

    console.log('🔍 SCHEDULER - Diagnostic RLS - Rendez-vous retournés:', diagnosticData?.length || 0);
    console.log('🔍 SCHEDULER - Diagnostic RLS - Erreur:', diagnosticError);
    if (diagnosticData) {
      diagnosticData.forEach(apt => {
        console.log(`🔍 SCHEDULER - RDV ${apt.id}: professional_id=${apt.professional_id}, intervenant_id=${apt.intervenant_id}`);
      });
    }

    // Vérifier également si l'utilisateur existe bien dans auth.users
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    console.log('🔍 SCHEDULER - Auth user:', authUser?.user?.id, 'Email:', authUser?.user?.email);
    console.log('🔍 SCHEDULER - Auth error:', authError);

    // Maintenant que RLS est activé, cette requête ne retournera QUE les rendez-vous autorisés
    // Les politiques RLS filtrent automatiquement côté base de données
    const { data: authorizedAppointments, error: appointmentError } = await supabase
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
      .order('start_time', { ascending: true });

    if (appointmentError) {
      console.error('🔍 SCHEDULER - Erreur lors du chargement des rendez-vous:', appointmentError);
      throw appointmentError;
    }

    console.log('🔍 SCHEDULER - Rendez-vous autorisés (après RLS):', authorizedAppointments?.length || 0);
    
    // Transformer les données pour correspondre au type Appointment
    const transformedData = (authorizedAppointments || []).map(item => ({
      ...item,
      status: item.status as 'scheduled' | 'completed' | 'cancelled',
      recurrence_type: item.recurrence_type as 'weekly' | 'monthly' | undefined,
      client: item.clients,
      intervenant: item.intervenants,
      caregivers: []
    }));

    console.log('🔍 SCHEDULER - Rendez-vous finaux après transformation:', transformedData.length);
    transformedData.forEach(apt => {
      console.log('🔍 SCHEDULER - RDV autorisé:', apt.id, 'Professional:', apt.professional_id, 'Intervenant:', apt.intervenant?.email, 'Date:', apt.start_time);
    });

    setAppointments(transformedData);
  };

  const loadClients = async () => {
    if (!user) return;

    console.log('🔍 SCHEDULER - Chargement des clients pour l\'utilisateur:', user.id);

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('created_by', user.id)
      .order('last_name', { ascending: true });

    if (error) {
      console.error('🔍 SCHEDULER - Erreur lors du chargement des clients:', error);
      throw error;
    }

    console.log('🔍 SCHEDULER - Clients chargés:', data?.length || 0);
    setClients(data || []);
  };

  const loadIntervenants = async () => {
    if (!user) return;

    console.log('🔍 SCHEDULER - Chargement des intervenants pour l\'utilisateur:', user.id);

    const { data, error } = await supabase
      .from('intervenants')
      .select('*')
      .eq('created_by', user.id)
      .order('last_name', { ascending: true });

    if (error) {
      console.error('🔍 SCHEDULER - Erreur lors du chargement des intervenants:', error);
      throw error;
    }

    console.log('🔍 SCHEDULER - Intervenants chargés:', data?.length || 0);
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

  const handleAppointmentDelete = async (appointmentId: string, deleteReport?: boolean) => {
    try {
      // Si on doit supprimer le rapport d'intervention
      if (deleteReport) {
        const appointmentToDelete = appointments.find(apt => apt.id === appointmentId);
        if (appointmentToDelete?.intervention_report_id) {
          const { error: reportError } = await supabase
            .from('intervention_reports')
            .delete()
            .eq('id', appointmentToDelete.intervention_report_id);

          if (reportError) {
            console.error('Erreur lors de la suppression du rapport:', reportError);
            toast({
              title: 'Erreur',
              description: 'Impossible de supprimer le rapport d\'intervention',
              variant: 'destructive',
            });
            return;
          }
        }
      }

      // Supprimer le rendez-vous
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Erreur lors de la suppression du rendez-vous:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le rendez-vous',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Succès',
        description: deleteReport 
          ? 'Rendez-vous et rapport d\'intervention supprimés avec succès'
          : 'Rendez-vous supprimé avec succès',
      });

      // Fermer le formulaire si le rendez-vous supprimé était sélectionné
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setShowAppointmentForm(false);
        setSelectedAppointment(null);
      }

      loadAppointments();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        variant: 'destructive',
      });
    }
  };

  // Si l'utilisateur connecté est un intervenant, masquer certains onglets et actions
  const isIntervenant = !!currentIntervenantId;

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">
            {isIntervenant ? 'Mes Rendez-vous' : 'Planificateur Professionnel'}
          </h1>
          
          {/* Actions pour desktop - masquées pour les intervenants */}
          {!isIntervenant && (
            <div className="hidden md:flex gap-3">
              <AppointmentExporter professionalId={user?.id || ''} />
              <InvoiceGenerator professionalId={user?.id || ''} />
              <Button 
                onClick={() => setShowAppointmentForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouveau rendez-vous
              </Button>
            </div>
          )}

          {/* Actions pour mobile - masquées pour les intervenants */}
          {!isIntervenant && (
            <div className="flex md:hidden gap-2 w-full sm:w-auto">
              <ActionMenu professionalId={user?.id || ''} />
              <Button 
                onClick={() => setShowAppointmentForm(true)}
                className="flex items-center gap-2 flex-1 sm:flex-none"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau rendez-vous</span>
                <span className="sm:hidden">Nouveau RDV</span>
              </Button>
            </div>
          )}
        </div>

        {/* Onglets - simplifiés pour les intervenants */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'calendar' ? 'default' : 'outline'}
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            {isIntervenant ? 'Mes Rendez-vous' : 'Calendrier'}
          </Button>
          {!isIntervenant && (
            <>
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
            </>
          )}
        </div>

        {activeTab === 'calendar' && (
          <>
            {!isIntervenant && (
              <SchedulerFilters
                clients={clients}
                intervenants={intervenants}
                selectedClientId={selectedClientId}
                selectedIntervenantId={selectedIntervenantId}
                onClientChange={setSelectedClientId}
                onIntervenantChange={setSelectedIntervenantId}
              />
            )}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {isIntervenant ? 'Mes rendez-vous' : 'Planning des rendez-vous'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentCalendar
                  appointments={filteredAppointments}
                  onAppointmentEdit={handleAppointmentEdit}
                  onAppointmentDelete={handleAppointmentDelete}
                />
              </CardContent>
            </Card>
          </>
        )}

        {!isIntervenant && activeTab === 'clients' && (
          <ClientManager 
            clients={clients}
            onClientUpdate={loadClients}
          />
        )}

        {!isIntervenant && activeTab === 'intervenants' && (
          <IntervenantManager 
            intervenants={intervenants}
            onIntervenantUpdate={loadIntervenants}
          />
        )}

        {showAppointmentForm && !isIntervenant && (
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
