
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const SyncPermissionsButton = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSyncPermissions = async () => {
    setLoading(true);
    console.log('=== DEBUT SYNCHRONISATION PERMISSIONS ===');

    try {
      const { data, error } = await supabase.functions.invoke('sync-invitation-permissions', {
        body: {}
      });

      console.log('Réponse de la fonction:', { data, error });

      if (error) {
        throw error;
      }

      toast({
        title: "Synchronisation réussie",
        description: "Les permissions des utilisateurs invités ont été corrigées avec succès."
      });

      console.log('Synchronisation terminée avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la synchronisation des permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('=== FIN SYNCHRONISATION PERMISSIONS ===');
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Corriger les permissions d'invitation
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Synchroniser les permissions d'invitation</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va corriger les permissions des utilisateurs qui ont été invités mais qui n'ont pas 
            automatiquement reçu les accès appropriés (blog, histoire de vie, journal). 
            
            Cela résoudra les problèmes d'accès pour les utilisateurs comme Olivier qui ne voient pas 
            les contenus auxquels ils devraient avoir accès selon leur invitation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSyncPermissions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Synchronisation...' : 'Synchroniser'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SyncPermissionsButton;
