
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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleSyncPermissions = async () => {
    setLoading(true);
    setErrorDetails(null);
    console.log('=== DEBUT SYNCHRONISATION PERMISSIONS ===');
    console.log('Timestamp de requête:', new Date().toISOString());

    try {
      // Préparer les données à envoyer
      const requestData = { 
        timestamp: new Date().toISOString(),
        clientInfo: navigator.userAgent
      };
      
      console.log('Données de requête:', requestData);

      // Appel à la fonction Edge avec plus de détails
      console.log('Envoi de la requête à la fonction Edge...');
      const { data, error } = await supabase.functions.invoke('sync-invitation-permissions', {
        body: requestData
      });

      console.log('Réponse complète de la fonction:', { data, error });

      if (error) {
        console.error('Erreur détaillée:', {
          message: error.message,
          context: error.context,
          details: error.details,
          name: error.name,
          stack: error.stack,
          code: error.code
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
      
      // Récupérer autant de détails que possible
      let errorMessage = "Erreur lors de la synchronisation des permissions";
      let details = "";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Collecter les détails techniques
      if (error.stack) {
        details += `Stack: ${error.stack}\n`;
      }
      if (error.code) {
        details += `Code: ${error.code}\n`;
      }
      if (error.details) {
        details += `Détails: ${typeof error.details === 'object' ? JSON.stringify(error.details) : error.details}\n`;
      }

      setErrorDetails(details || "Pas de détails techniques disponibles");

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
            
            {errorDetails && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs font-mono text-red-800 whitespace-pre-wrap overflow-auto max-h-[200px]">
                <p className="font-bold mb-1">Détails techniques de la dernière erreur:</p>
                {errorDetails}
              </div>
            )}
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
