
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

      // Récupérer les messages d'abord
      const { data: messagesData, error: messagesError } = await supabase
        .from('caregiver_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) {
        console.error('❌ Erreur lors de la récupération des messages:', messagesError);
        setMessages([]);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('✅ Aucun message trouvé');
        setMessages([]);
        return;
      }

      // Récupérer les profils des auteurs
      const authorIds = [...new Set(messagesData.map(msg => msg.author_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', authorIds);

      if (profilesError) {
        console.error('❌ Erreur lors de la récupération des profils:', profilesError);
        // Continuer avec les messages sans les profils
        const messagesWithoutProfiles = messagesData.map(message => ({
          ...message,
          author_profile: {
            display_name: 'Utilisateur inconnu',
            email: 'email.inconnu@example.com'
          }
        }));
        setMessages(messagesWithoutProfiles);
        return;
      }

      // Créer un map des profils pour un accès rapide
      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

      // Combiner les messages avec les profils
      const messagesWithProfiles = messagesData.map(message => ({
        ...message,
        author_profile: {
          display_name: profilesMap.get(message.author_id)?.display_name,
          email: profilesMap.get(message.author_id)?.email || 'email.inconnu@example.com'
        }
      }));

      console.log('✅ Messages optimisés trouvés:', messagesWithProfiles.length);
      setMessages(messagesWithProfiles);

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
