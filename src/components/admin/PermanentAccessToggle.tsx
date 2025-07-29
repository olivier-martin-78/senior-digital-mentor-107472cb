import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';

interface PermanentAccessToggleProps {
  userId: string;
  currentValue: boolean;
  onToggle?: () => void;
}

export const PermanentAccessToggle = ({ userId, currentValue, onToggle }: PermanentAccessToggleProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggle = async () => {
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ permanent_access: !currentValue })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Accès permanent mis à jour",
        description: `L'accès permanent a été ${!currentValue ? 'activé' : 'désactivé'} avec succès.`,
      });

      onToggle?.();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'accès permanent:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'accès permanent.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isUpdating ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <Switch
          checked={currentValue}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
        />
      )}
      <span className="text-sm text-muted-foreground">
        {currentValue ? 'Activé' : 'Désactivé'}
      </span>
    </div>
  );
};