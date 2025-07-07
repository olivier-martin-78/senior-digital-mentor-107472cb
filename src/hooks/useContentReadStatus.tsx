
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ContentReadStatus {
  isRead: boolean;
  readAt: string | null;
  markAsRead: () => Promise<void>;
}

export const useContentReadStatus = (
  contentType: 'blog' | 'diary' | 'wish',
  contentId: string
): ContentReadStatus => {
  const { user } = useAuth();
  const [isRead, setIsRead] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);

  useEffect(() => {
    const checkReadStatus = async () => {
      if (!user || !contentId) return;

      try {
        const { data, error } = await supabase
          .from('user_content_read_status')
          .select('read_at')
          .eq('user_id', user.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .maybeSingle();

        if (error) {
          console.error('Erreur lors de la vérification du statut de lecture:', error);
          return;
        }

        if (data) {
          setIsRead(true);
          setReadAt(data.read_at);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de lecture:', error);
      }
    };

    checkReadStatus();
  }, [user, contentType, contentId]);

  const markAsRead = async () => {
    if (!user || !contentId || isRead) return;

    try {
      const { error } = await supabase
        .from('user_content_read_status')
        .upsert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          read_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        return;
      }

      setIsRead(true);
      setReadAt(new Date().toISOString());
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  return { isRead, readAt, markAsRead };
};
