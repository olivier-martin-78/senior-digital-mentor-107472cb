
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Client, Appointment, Intervenant } from '@/types/appointments';
import { InterventionFormData } from '../types/FormData';
import { InterventionReport } from '@/types/intervention';

export const useInterventionForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report_id');
  const appointmentId = searchParams.get('appointment_id');

  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allIntervenants, setAllIntervenants] = useState<Intervenant[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showAppointmentSelector, setShowAppointmentSelector] = useState(false);

  const [formData, setFormData] = useState<InterventionFormData>({
    appointment_id: appointmentId || '',
    patient_name: '',
    auxiliary_name: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    activities: [],
    activities_other: '',
    physical_state: [],
    physical_state_other: '',
    pain_location: '',
    mental_state: [],
    mental_state_change: '',
    hygiene: [],
    hygiene_comments: '',
    appetite: '',
    appetite_comments: '',
    hydration: '',
    observations: '',
    follow_up: [],
    follow_up_other: '',
    hourly_rate: '',
    media_files: [],
    audio_url: '',
    client_rating: 0,
    client_comments: '',
  });

  const loadData = async () => {
    if (!user) return;

    try {
      setLoadingData(true);
      
      // Load clients
      const { data: allClients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('created_by', user.id);

      if (clientError) {
        console.error('Error loading clients:', clientError);
      }

      const authorizedClients: Client[] = allClients || [];
      setClients(authorizedClients);

      // Load appointments
      const loadedAppointments = await loadAppointments();
      
      // Load intervenants
      await loadIntervenants();

      // Load existing report if editing
      if (reportId) {
        await loadExistingReport(loadedAppointments);
      } else if (appointmentId && loadedAppointments.length > 0) {
        const foundAppointment = loadedAppointments.find(apt => apt.id === appointmentId);
        if (foundAppointment) {
          handleAppointmentChange(appointmentId, loadedAppointments);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadAppointments = async () => {
    if (!user) {
      setAppointments([]);
      return [];
    }

    const { data: userAppointments, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (
          id, first_name, last_name, address, phone, email, color, hourly_rate, created_at, updated_at, created_by
        ),
        intervenants:intervenant_id (
          id, first_name, last_name, email, phone, speciality, active, created_at, updated_at, created_by
        )
      `);

    if (appointmentError) {
      console.error('Error loading appointments:', appointmentError);
      setAppointments([]);
      return [];
    }

    const transformedAppointments = (userAppointments || []).map(item => ({
      ...item,
      status: item.status as 'scheduled' | 'completed' | 'cancelled',
      recurrence_type: item.recurrence_type as 'weekly' | 'monthly' | undefined,
      client: item.clients,
      intervenant: item.intervenants,
      caregivers: []
    }));

    setAppointments(transformedAppointments);
    return transformedAppointments;
  };

  const loadIntervenants = async () => {
    if (!user) return;

    const { data: allIntervenantsData, error: intervenantError } = await supabase
      .from('intervenants')
      .select('*')
      .eq('created_by', user.id);

    if (intervenantError) {
      console.error('Error loading intervenants:', intervenantError);
      return;
    }

    setAllIntervenants(allIntervenantsData || []);
  };

  const loadExistingReport = async (appointmentsList: Appointment[]) => {
    if (!reportId || !user) return;

    try {
      const { data: report, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('Error loading report:', error);
        toast({
          title: 'Erreur d\'accès',
          description: 'Impossible de charger ce rapport d\'intervention.',
          variant: 'destructive',
        });
        return;
      }

      if (report) {
        const typedReport = report as InterventionReport;
        setFormData({
          appointment_id: typedReport.appointment_id || '',
          patient_name: typedReport.patient_name || '',
          auxiliary_name: typedReport.auxiliary_name || '',
          date: typedReport.date || '',
          start_time: typedReport.start_time || '',
          end_time: typedReport.end_time || '',
          activities: Array.isArray(typedReport.activities) ? typedReport.activities : [],
          activities_other: typedReport.activities_other || '',
          physical_state: Array.isArray(typedReport.physical_state) ? typedReport.physical_state : [],
          physical_state_other: typedReport.physical_state_other || '',
          pain_location: typedReport.pain_location || '',
          mental_state: Array.isArray(typedReport.mental_state) ? typedReport.mental_state : [],
          mental_state_change: typedReport.mental_state_change || '',
          hygiene: Array.isArray(typedReport.hygiene) ? typedReport.hygiene : [],
          hygiene_comments: typedReport.hygiene_comments || '',
          appetite: typedReport.appetite || '',
          appetite_comments: typedReport.appetite_comments || '',
          hydration: typedReport.hydration || '',
          observations: typedReport.observations || '',
          follow_up: Array.isArray(typedReport.follow_up) ? typedReport.follow_up : [],
          follow_up_other: typedReport.follow_up_other || '',
          hourly_rate: typedReport.hourly_rate?.toString() || '',
          media_files: Array.isArray(typedReport.media_files) ? typedReport.media_files : [],
          audio_url: typedReport.audio_url || '',
          client_rating: typedReport.client_rating || 0,
          client_comments: typedReport.client_comments || '',
        });

        if (typedReport.appointment_id && appointmentsList.length > 0) {
          const foundAppointment = appointmentsList.find(apt => apt.id === typedReport.appointment_id);
          if (foundAppointment) {
            setSelectedAppointment(foundAppointment);
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error loading report:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite.',
        variant: 'destructive',
      });
    }
  };

  const handleAppointmentChange = (appointmentId: string, appointmentsList?: Appointment[]) => {
    const appointmentsToUse = appointmentsList || appointments;
    
    if (appointmentId === "none") {
      setSelectedAppointment(null);
      setFormData(prev => ({
        ...prev,
        appointment_id: '',
      }));
      return;
    }

    const appointment = appointmentsToUse.find(apt => apt.id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowAppointmentSelector(false);
      
      const startDate = new Date(appointment.start_time);
      const endDate = new Date(appointment.end_time);
      
      setFormData(prev => ({
        ...prev,
        appointment_id: appointmentId,
        patient_name: appointment.client ? `${appointment.client.first_name} ${appointment.client.last_name}` : '',
        auxiliary_name: appointment.intervenant ? `${appointment.intervenant.first_name} ${appointment.intervenant.last_name}` : 
                       (user?.email?.split('@')[0] || 'Auxiliaire'),
        date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_time: endDate.toTimeString().slice(0, 5),
        hourly_rate: appointment.client?.hourly_rate?.toString() || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.patient_name || !formData.auxiliary_name || !formData.date) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const reportData = {
        ...formData,
        professional_id: user.id,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        appointment_id: formData.appointment_id || null,
        client_rating: formData.client_rating || null,
        client_comments: formData.client_comments || null,
      };

      console.log('Saving report data:', reportData);

      if (reportId) {
        const { error } = await supabase
          .from('intervention_reports')
          .update(reportData)
          .eq('id', reportId);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        toast({
          title: 'Succès',
          description: 'Rapport mis à jour avec succès',
        });
      } else {
        const { data: newReport, error } = await supabase
          .from('intervention_reports')
          .insert([reportData])
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        if (formData.appointment_id && newReport) {
          await supabase
            .from('appointments')
            .update({ 
              intervention_report_id: newReport.id,
              status: 'completed'
            })
            .eq('id', formData.appointment_id);
        }

        toast({
          title: 'Succès',
          description: 'Rapport créé avec succès',
        });
      }

      navigate('/scheduler');
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de sauvegarder le rapport: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, reportId, appointmentId]);

  return {
    formData,
    setFormData,
    clients,
    appointments,
    allIntervenants,
    selectedAppointment,
    setSelectedAppointment,
    loading,
    loadingData,
    showAppointmentSelector,
    setShowAppointmentSelector,
    reportId,
    handleAppointmentChange,
    handleSubmit,
  };
};
