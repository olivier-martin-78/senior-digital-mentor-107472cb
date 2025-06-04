
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
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour envoyer des notifications.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('🔍 GroupNotification - Début envoi notification:', {
        contentType,
        contentId,
        title,
        authorId: user.id,
        userEmail: user.email
      });

      // Vérifier la session d'abord
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔍 GroupNotification - Session:', {
        hasSession: !!session,
        sessionError: sessionError,
        accessToken: session?.access_token ? 'present' : 'missing'
      });
      
      if (sessionError || !session) {
        throw new Error('Session non disponible - ' + (sessionError?.message || 'Session manquante'));
      }

      // Préparer les données
      const requestBody = {
        contentType,
        contentId,
        title,
        authorId: user.id
      };

      console.log('🔍 GroupNotification - Appel fonction avec:', requestBody);

      // Appeler l'edge function
      const { data, error } = await supabase.functions.invoke('send-group-notification', {
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 GroupNotification - Réponse fonction:', { 
        data, 
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : null 
      });

      if (error) {
        console.error('🔍 GroupNotification - Erreur fonction:', error);
        throw new Error(`Erreur fonction: ${error.message}`);
      }

      // Marquer la notification comme envoyée dans la base de données
      const tableName = contentType === 'blog' ? 'blog_posts' : 
                       contentType === 'diary' ? 'diary_entries' : 'wish_posts';
      
      console.log('🔍 GroupNotification - Mise à jour table:', tableName);
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ 
          email_notification_sent: true,
          email_notification_requested: true 
        })
        .eq('id', contentId);

      if (updateError) {
        console.error('🔍 GroupNotification - Erreur mise à jour BDD:', updateError);
        throw new Error(`Erreur base de données: ${updateError.message}`);
      }

      console.log('🔍 GroupNotification - Succès complet');

      toast({
        title: 'Notifications envoyées',
        description: 'Les membres de votre groupe ont été notifiés de votre nouvelle publication.',
      });

      onNotificationSent?.();
      
    } catch (error: any) {
      console.error('🔍 GroupNotification - Erreur complète:', {
        error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      let errorMessage = 'Impossible d\'envoyer les notifications. Veuillez réessayer.';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Problème de connexion. Vérifiez votre connexion internet et réessayez.';
      } else if (error.message?.includes('Session')) {
        errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
      } else if (error.message?.includes('fonction')) {
        errorMessage = `Erreur du serveur: ${error.message}`;
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      toast({
        title: 'Erreur d\'envoi',
        description: errorMessage,
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
