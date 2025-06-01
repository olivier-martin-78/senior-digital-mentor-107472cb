
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
      // Appel à la fonction Edge avec plus de détails
      const { data, error } = await supabase.functions.invoke('sync-invitation-permissions', {
        body: { timestamp: new Date().toISOString() }
      });

      console.log('Réponse complète de la fonction:', { data, error });

      if (error) {
        console.error('Erreur détaillée:', {
          message: error.message,
          context: error.context,
          details: error.details
        });
        throw new Error(`Erreur de la fonction Edge: ${error.message || 'Erreur inconnue'}`);
      }

      if (data?.error) {
        console.error('Erreur dans les données retournées:', data);
        throw new Error(data.error);
      }

      toast({
        title: "Synchronisation réussie",
        description: data?.message || "Les permissions des utilisateurs invités ont été corrigées avec succès."
      });

      console.log('Synchronisation terminée avec succès');
    } catch (error: any) {
      console.error('=== ERREUR SYNCHRONISATION ===');
      console.error('Type d\'erreur:', typeof error);
      console.error('Message:', error.message);
      console.error('Erreur complète:', error);
      
      let errorMessage = "Erreur lors de la synchronisation des permissions";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Erreur de synchronisation",
        description: errorMessage,
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
            
            <br /><br />
            <strong>Note:</strong> Cette opération utilise une fonction de base de données sécurisée 
            et peut prendre quelques secondes à s'exécuter.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSyncPermissions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Synchronisation...
              </>
            ) : (
              'Synchroniser'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SyncPermissionsButton;
