
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

  useEffect(() => {
    const fetchCaregiversData = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        // Récupérer les clients pour lesquels l'utilisateur est proche aidant
        const { data: caregiverClients } = await supabase
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

        // Récupérer aussi les clients pour lesquels l'utilisateur est professionnel
        const { data: professionalClients } = await supabase
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

        // Combiner et dédupliquer les clients
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

        if (clientsList.length > 0) {
          const clientIds = clientsList.map(c => c.id);

          // Récupérer les rapports d'intervention
          const { data: reports } = await supabase
            .from('intervention_reports')
            .select('*')
            .in('appointment_id', 
              await supabase
                .from('appointments')
                .select('id')
                .in('client_id', clientIds)
                .then(res => res.data?.map(a => a.id) || [])
            )
            .order('date', { ascending: false });

          setInterventionReports(reports || []);

          // Récupérer les messages de coordination avec les profils des auteurs
          const { data: messagesData } = await supabase
            .from('caregiver_messages')
            .select(`
              id,
              message,
              created_at,
              author_id,
              client_id
            `)
            .in('client_id', clientIds)
            .order('created_at', { ascending: false });

          if (messagesData) {
            // Récupérer les profils des auteurs séparément
            const authorIds = [...new Set(messagesData.map(m => m.author_id))];
            const { data: authorsData } = await supabase
              .from('profiles')
              .select('id, display_name, email')
              .in('id', authorIds);

            // Combiner les messages avec les profils des auteurs
            const messagesWithAuthors = messagesData.map(message => ({
              ...message,
              author_profile: authorsData?.find(author => author.id === message.author_id) || {
                display_name: 'Utilisateur inconnu',
                email: ''
              }
            }));

            setMessages(messagesWithAuthors);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données aidants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaregiversData();
  }, [session]);

  const sendMessage = async (clientId: string, message: string) => {
    if (!session?.user) return false;

    try {
      const { error } = await supabase
        .from('caregiver_messages')
        .insert({
          client_id: clientId,
          author_id: session.user.id,
          message: message
        });

      if (error) throw error;

      // Recharger les messages pour ce client
      const { data: messagesData } = await supabase
        .from('caregiver_messages')
        .select(`
          id,
          message,
          created_at,
          author_id,
          client_id
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (messagesData) {
        // Récupérer les profils des auteurs
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
      console.error('Erreur lors de l\'envoi du message:', error);
      return false;
    }
  };

  return {
    clients,
    interventionReports,
    messages,
    isLoading,
    sendMessage
  };
};
