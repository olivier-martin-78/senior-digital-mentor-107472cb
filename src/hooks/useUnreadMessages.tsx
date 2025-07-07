
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UnreadMessageData {
  unreadCount: number;
  unreadMessageIds: string[];
}

export const useUnreadMessages = (clientId?: string, markAsReadOnView: boolean = false) => {
  const { session } = useAuth();
  const [unreadData, setUnreadData] = useState<UnreadMessageData>({
    unreadCount: 0,
    unreadMessageIds: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadMessages = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      // Récupérer tous les messages auxquels l'utilisateur a accès
      let messagesQuery = supabase
        .from('caregiver_messages')
        .select('id, author_id, created_at, client_id');

      if (clientId) {
        messagesQuery = messagesQuery.eq('client_id', clientId);
      }

      const { data: messages, error: messagesError } = await messagesQuery;

      if (messagesError) {
        console.error('Erreur lors de la récupération des messages:', messagesError);
        return;
      }

      if (!messages || messages.length === 0) {
        setUnreadData({ unreadCount: 0, unreadMessageIds: [] });
        return;
      }

      // Récupérer les messages déjà lus par cet utilisateur
      const messageIds = messages.map(m => m.id);
      const { data: readMessages, error: readError } = await supabase
        .from('user_messages_read_status')
        .select('message_id')
        .eq('user_id', session.user.id)
        .in('message_id', messageIds);

      if (readError) {
        console.error('Erreur lors de la récupération des messages lus:', readError);
        return;
      }

      const readMessageIds = new Set(readMessages?.map(r => r.message_id) || []);
      
      // Filtrer les messages non lus (excluant ceux créés par l'utilisateur actuel)
      const unreadMessages = messages.filter(message => 
        !readMessageIds.has(message.id) && message.author_id !== session.user.id
      );

      const unreadMessageIds = unreadMessages.map(m => m.id);
      
      setUnreadData({
        unreadCount: unreadMessageIds.length,
        unreadMessageIds
      });
    } catch (error) {
      console.error('Erreur lors du chargement des messages non lus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!session?.user || unreadData.unreadMessageIds.length === 0) {
      return;
    }

    try {
      // Marquer tous les messages non lus comme lus
      const readStatusRecords = unreadData.unreadMessageIds.map(messageId => ({
        user_id: session.user.id,
        message_id: messageId
      }));

      const { error } = await supabase
        .from('user_messages_read_status')
        .upsert(readStatusRecords);

      if (error) {
        console.error('Erreur lors du marquage des messages comme lus:', error);
        return;
      }

      setUnreadData({
        unreadCount: 0,
        unreadMessageIds: []
      });
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  };

  useEffect(() => {
    fetchUnreadMessages();
  }, [session, clientId]);

  // Marquer comme lu quand l'utilisateur visite l'espace
  useEffect(() => {
    if (markAsReadOnView && unreadData.unreadCount > 0) {
      markAllAsRead();
    }
  }, [markAsReadOnView]);

  return {
    ...unreadData,
    isLoading,
    markAllAsRead,
    refreshUnreadMessages: fetchUnreadMessages
  };
};
