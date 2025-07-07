
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

export const useCaregiverMessages = () => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<CaregiverMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async () => {
    if (!session?.user) {
      console.log('❌ Pas d\'utilisateur connecté pour les messages');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Récupération optimisée des messages...');

      // Requête optimisée avec JOIN pour récupérer messages + profils en une fois
      const { data: messagesData, error: messagesError } = await supabase
        .from('caregiver_messages')
        .select(`
          id,
          message,
          created_at,
          author_id,
          client_id,
          notification_sent,
          notification_sent_at,
          profiles!inner(
            display_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50); // Limiter à 50 messages récents

      if (messagesError) {
        console.error('❌ Erreur lors de la récupération des messages:', messagesError);
        setMessages([]);
      } else {
        console.log('✅ Messages optimisés trouvés:', messagesData?.length || 0);
        
        // Transformer les données pour correspondre à l'interface attendue
        const transformedMessages = messagesData?.map(message => ({
          ...message,
          author_profile: {
            display_name: message.profiles?.display_name,
            email: message.profiles?.email || ''
          }
        })) || [];
        
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('❌ Erreur générale lors du chargement des messages:', error);
      setMessages([]);
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

      // Recharger les messages après ajout
      await fetchMessages();
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [session]);

  return {
    messages,
    isLoading,
    sendMessage,
    refetch: fetchMessages
  };
};
