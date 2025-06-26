
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InterventionNotificationButtonProps {
  reportId: string;
  title: string;
  disabled?: boolean;
  alreadySent?: boolean;
}

const InterventionNotificationButton: React.FC<InterventionNotificationButtonProps> = ({
  reportId,
  title,
  disabled = false,
  alreadySent = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleNotification = async () => {
    if (isLoading || disabled) return;

    try {
      setIsLoading(true);
      
      console.log('🔔 Envoi notification rapport intervention:', { reportId, title });

      const { data, error } = await supabase.functions.invoke('send-intervention-notification', {
        body: {
          reportId,
          title
        }
      });

      if (error) {
        console.error('❌ Erreur envoi notification:', error);
        throw new Error(error.message || 'Erreur lors de l\'envoi de la notification');
      }

      console.log('✅ Notification envoyée:', data);

      if (data?.success) {
        toast({
          title: "Notification envoyée",
          description: data.message || `Notification envoyée aux proches aidants`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Information",
          description: data?.message || "Aucun proche aidant à notifier",
          variant: "default",
        });
      }

    } catch (error: any) {
      console.error('❌ Erreur notification:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleNotification}
      disabled={isLoading || disabled}
      variant={alreadySent ? "secondary" : "default"}
      size="sm"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : alreadySent ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      
      {isLoading 
        ? "Envoi en cours..." 
        : alreadySent 
          ? "Notification envoyée" 
          : "Notifier les proches aidants"
      }
    </Button>
  );
};

export default InterventionNotificationButton;
