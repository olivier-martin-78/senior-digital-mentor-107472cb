
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MessageStatus {
  id: string;
  notification_sent: boolean;
  notification_sent_at: string | null;
  is_read: boolean;
  read_at: string | null;
}

export const useMessageStatus = (messages: any[], onStatusChange?: () => void) => {
  const { user } = useAuth();
  const [messageStatuses, setMessageStatuses] = useState<Record<string, MessageStatus>>({});
  const [loading, setLoading] = useState(false);

  const fetchMessageStatuses = async () => {
    if (!user || messages.length === 0) {
      setMessageStatuses({});
      return;
    }

    try {
      setLoading(true);
      const messageIds = messages.map(m => m.id);

      console.log('🔍 useMessageStatus - Fetch des statuts pour messages:', messageIds.map(id => id.substring(0, 8)));

      // Récupérer les statuts de lecture pour l'utilisateur connecté
      const { data: readStatuses, error: readError } = await supabase
        .from('user_messages_read_status')
        .select('message_id, read_at')
        .eq('user_id', user.id)
        .in('message_id', messageIds);

      if (readError) {
        console.error('Erreur lors de la récupération des statuts de lecture:', readError);
        return;
      }

      // Créer un map des statuts de lecture
      const readStatusMap = new Map(
        readStatuses?.map(status => [status.message_id, status.read_at]) || []
      );

      // Créer les statuts finaux
      const statuses: Record<string, MessageStatus> = {};
      messages.forEach(message => {
        const readAt = readStatusMap.get(message.id);
        statuses[message.id] = {
          id: message.id,
          notification_sent: message.notification_sent || false,
          notification_sent_at: message.notification_sent_at || null,
          is_read: !!readAt,
          read_at: readAt || null
        };
      });

      console.log('🔍 useMessageStatus - Statuts calculés:', Object.entries(statuses).map(([id, status]) => ({
        id: id.substring(0, 8),
        notification_sent: status.notification_sent,
        notification_sent_at: status.notification_sent_at
      })));

      setMessageStatuses(statuses);
    } catch (error) {
      console.error('Erreur lors du chargement des statuts de messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsSent = async (messageId: string) => {
    try {
      console.log('🔔 markNotificationAsSent - Début pour message:', messageId.substring(0, 8));
      
      const { error } = await supabase
        .from('caregiver_messages')
        .update({ 
          notification_sent: true, 
          notification_sent_at: new Date().toISOString() 
        })
        .eq('id', messageId);

      if (error) {
        console.error('🔔 markNotificationAsSent - Erreur lors de la mise à jour du statut notification:', error);
        return false;
      }

      console.log('🔔 markNotificationAsSent - Mise à jour DB réussie pour message:', messageId.substring(0, 8));

      // Mettre à jour le state local
      setMessageStatuses(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          notification_sent: true,
          notification_sent_at: new Date().toISOString()
        }
      }));

      console.log('🔔 markNotificationAsSent - State local mis à jour');

      // Déclencher le callback pour forcer un refresh des données parentes
      if (onStatusChange) {
        console.log('🔄 markNotificationAsSent - Déclenchement du refresh...');
        onStatusChange();
      }

      return true;
    } catch (error) {
      console.error('🔔 markNotificationAsSent - Erreur générale:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchMessageStatuses();
  }, [user, messages]);

  return {
    messageStatuses,
    loading,
    markNotificationAsSent,
    refetch: fetchMessageStatuses
  };
};
