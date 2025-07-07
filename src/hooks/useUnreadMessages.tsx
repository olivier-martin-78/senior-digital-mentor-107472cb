
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UnreadMessageData {
  unreadCount: number;
  unreadMessageIds: string[];
}

export const useUnreadMessages = (clientId?: string) => {
  const { session } = useAuth();
  const [unreadData, setUnreadData] = useState<UnreadMessageData>({
    unreadCount: 0,
    unreadMessageIds: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        // Pour cet exemple, nous considérons qu'un message est "non lu" s'il n'a pas été créé par l'utilisateur actuel
        // et s'il a été créé dans les 24 dernières heures
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        let query = supabase
          .from('caregiver_messages')
          .select('id, author_id, created_at')
          .neq('author_id', session.user.id)
          .gte('created_at', oneDayAgo.toISOString());

        if (clientId) {
          query = query.eq('client_id', clientId);
        }

        const { data: messages, error } = await query;

        if (error) {
          console.error('Erreur lors de la récupération des messages non lus:', error);
          return;
        }

        const unreadMessageIds = messages?.map(m => m.id) || [];
        
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

    fetchUnreadMessages();
  }, [session, clientId]);

  return {
    ...unreadData,
    isLoading
  };
};
