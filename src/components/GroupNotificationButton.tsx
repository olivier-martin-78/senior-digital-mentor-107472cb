
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Send } from 'lucide-react';

interface GroupNotificationButtonProps {
  contentType: 'blog' | 'diary' | 'wish';
  contentId: string;
  title: string;
  isNotificationSent?: boolean;
  onNotificationSent?: () => void;
}

const GroupNotificationButton: React.FC<GroupNotificationButtonProps> = ({
  contentType,
  contentId,
  title,
  isNotificationSent = false,
  onNotificationSent
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Ne pas afficher le bouton si la notification a déjà été envoyée
  if (isNotificationSent) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <Mail className="w-4 h-4 mr-2" />
        Notification envoyée
      </div>
    );
  }

  const handleSendNotification = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Appeler l'edge function pour envoyer les notifications
      const { error } = await supabase.functions.invoke('send-group-notification', {
        body: {
          contentType,
          contentId,
          title,
          authorId: user.id
        }
      });

      if (error) {
        throw error;
      }

      // Marquer la notification comme envoyée dans la base de données
      const tableName = contentType === 'blog' ? 'blog_posts' : 
                       contentType === 'diary' ? 'diary_entries' : 'wish_posts';
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ 
          email_notification_sent: true,
          email_notification_requested: true 
        })
        .eq('id', contentId);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Notifications envoyées',
        description: 'Les membres de votre groupe ont été notifiés de votre nouvelle publication.',
      });

      onNotificationSent?.();
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer les notifications. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSendNotification}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="text-tranches-sage border-tranches-sage hover:bg-tranches-sage hover:text-white"
    >
      <Send className="w-4 h-4 mr-2" />
      {isLoading ? 'Envoi...' : 'Notifier le groupe'}
    </Button>
  );
};

export default GroupNotificationButton;
