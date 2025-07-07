import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CaregiverClient {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  phone?: string;
  email?: string;
}

interface InterventionReport {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  auxiliary_name: string;
  patient_name: string;
  client_rating?: number;
  client_comments?: string;
  observations?: string;
  professional_id: string;
  appointment_id?: string;
}

interface CaregiverMessage {
  id: string;
  message: string;
  created_at: string;
  author_id: string;
  client_id: string;
  notification_sent: boolean;
  notification_sent_at: string | null;
  author_profile: {
    display_name?: string;
    email: string;
  };
}

export const useCaregiversData = () => {
  const { session } = useAuth();
  const [clients, setClients] = useState<CaregiverClient[]>([]);
  const [interventionReports, setInterventionReports] = useState<InterventionReport[]>([]);
  const [messages, setMessages] = useState<CaregiverMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCaregiversData = async () => {
    if (!session?.user) {
      console.log('❌ Pas d\'utilisateur connecté');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Récupération des données pour l\'utilisateur:', session.user.email);

      const { data: caregiverClients, error: caregiverError } = await supabase
        .from('caregivers')
        .select(`
          client_id,
          clients:client_id (
            id,
            first_name,
            last_name,
            address,
            phone,
            email
          )
        `)
        .eq('email', session.user.email);

      if (caregiverError) {
        console.error('❌ Erreur lors de la récupération des clients aidant:', caregiverError);
      } else {
        console.log('✅ Clients trouvés pour aidant:', caregiverClients?.length || 0);
      }

      const { data: professionalClients, error: professionalError } = await supabase
        .from('appointments')
        .select(`
          client_id,
          clients:client_id (
            id,
            first_name,
            last_name,
            address,
            phone,
            email
          )
        `)
        .eq('professional_id', session.user.id);

      if (professionalError) {
        console.error('❌ Erreur lors de la récupération des clients professionnel:', professionalError);
      } else {
        console.log('✅ Clients trouvés pour professionnel:', professionalClients?.length || 0);
      }

      const allClients = new Map<string, CaregiverClient>();
      
      caregiverClients?.forEach(item => {
        if (item.clients) {
          allClients.set(item.clients.id, item.clients as CaregiverClient);
        }
      });

      professionalClients?.forEach(item => {
        if (item.clients) {
          allClients.set(item.clients.id, item.clients as CaregiverClient);
        }
      });

      const clientsList = Array.from(allClients.values());
      setClients(clientsList);
      console.log('📊 Total clients uniques:', clientsList.length);

      if (clientsList.length > 0) {
        const clientIds = clientsList.map(c => c.id);
        console.log('🎯 IDs des clients:', clientIds);

        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, client_id, professional_id, intervenant_id')
          .in('client_id', clientIds);

        if (appointmentsError) {
          console.error('❌ Erreur lors de la récupération des appointments:', appointmentsError);
        } else {
          console.log('✅ Appointments trouvés:', appointments?.length || 0);
          console.log('📋 Appointments détails:', appointments);
        }

        const appointmentIds = appointments?.map(a => a.id) || [];
        console.log('🎯 IDs des appointments:', appointmentIds);

        if (appointmentIds.length > 0) {
          const { data: reports, error: reportsError } = await supabase
            .from('intervention_reports')
            .select('*')
            .in('appointment_id', appointmentIds)
            .order('date', { ascending: false });

          if (reportsError) {
            console.error('❌ Erreur lors de la récupération des rapports:', reportsError);
          } else {
            console.log('✅ Rapports d\'intervention trouvés:', reports?.length || 0);
            console.log('📋 Rapports détails:', reports);
            setInterventionReports(reports || []);
          }
        } else {
          console.log('⚠️ Aucun appointment trouvé pour ces clients');
          setInterventionReports([]);
        }

        console.log('🔍 Récupération des messages avec refresh forcé...');
        const { data: messagesData, error: messagesError } = await supabase
          .from('caregiver_messages')
          .select(`
            id,
            message,
            created_at,
            author_id,
            client_id,
            notification_sent,
            notification_sent_at
          `)
          .in('client_id', clientIds)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error('❌ Erreur lors de la récupération des messages:', messagesError);
        } else {
          console.log('✅ Messages trouvés:', messagesData?.length || 0);
          console.log('🔍 DEBUG - Messages avec statut notification APRÈS REFRESH:', messagesData?.map(m => ({
            id: m.id.substring(0, 8),
            notification_sent: m.notification_sent,
            notification_sent_at: m.notification_sent_at
          })));
        }

        if (messagesData) {
          const authorIds = [...new Set(messagesData.map(m => m.author_id))];
          const { data: authorsData, error: authorsError } = await supabase
            .from('profiles')
            .select('id, display_name, email')
            .in('id', authorIds);

          if (authorsError) {
            console.error('❌ Erreur lors de la récupération des profils auteurs:', authorsError);
          }

          const messagesWithAuthors = messagesData.map(message => ({
            ...message,
            author_profile: authorsData?.find(author => author.id === message.author_id) || {
              display_name: 'Utilisateur inconnu',
              email: ''
            }
          }));

          setMessages(messagesWithAuthors);
          console.log('🔍 DEBUG - Messages finaux APRÈS REFRESH:', messagesWithAuthors.map(m => ({
            id: m.id.substring(0, 8),
            notification_sent: m.notification_sent,
            notification_sent_at: m.notification_sent_at,
            author: m.author_profile.display_name || m.author_profile.email
          })));
        }
      } else {
        console.log('⚠️ Aucun client trouvé pour cet utilisateur');
        setInterventionReports([]);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Erreur générale lors du chargement des données aidants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (clientId: string, message: string) => {
    if (!session?.user) return false;

    try {
      const { error } = await supabase
        .from('caregiver_messages')
        .insert({
          client_id: clientId,
          author_id: session.user.id,
          message: message,
          notification_sent: false,
          notification_sent_at: null
        });

      if (error) throw error;

      const { data: messagesData } = await supabase
        .from('caregiver_messages')
        .select(`
          id,
          message,
          created_at,
          author_id,
          client_id,
          notification_sent,
          notification_sent_at
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (messagesData) {
        const authorIds = [...new Set(messagesData.map(m => m.author_id))];
        const { data: authorsData } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', authorIds);

        const messagesWithAuthors = messagesData.map(message => ({
          ...message,
          author_profile: authorsData?.find(author => author.id === message.author_id) || {
            display_name: 'Utilisateur inconnu',
            email: ''
          }
        }));

        setMessages(prev => [
          ...messagesWithAuthors,
          ...prev.filter(m => m.client_id !== clientId)
        ]);
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      return false;
    }
  };

  const refreshMessages = async () => {
    console.log('🔄 Refresh forcé des messages...');
    await fetchCaregiversData();
  };

  useEffect(() => {
    fetchCaregiversData();
  }, [session]);

  return {
    clients,
    interventionReports,
    messages,
    isLoading,
    sendMessage,
    refreshMessages
  };
};
