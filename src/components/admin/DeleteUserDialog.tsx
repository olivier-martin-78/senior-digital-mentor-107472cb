
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
import { Trash2 } from 'lucide-react';

interface DeleteUserDialogProps {
  userId: string;
  userEmail: string;
  onUserDeleted: () => void;
  disabled?: boolean;
}

const DeleteUserDialog = ({ userId, userEmail, onUserDeleted, disabled }: DeleteUserDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDeleteUser = async () => {
    setLoading(true);
    console.log('Tentative de suppression de l\'utilisateur:', userId);
    
    try {
      const { error } = await supabase.rpc('delete_user_completely', {
        user_id_to_delete: userId
      });

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        throw error;
      }

      console.log('Utilisateur supprimé avec succès');
      toast({
        title: "Utilisateur supprimé",
        description: `L'utilisateur ${userEmail} a été supprimé avec succès.`
      });

      onUserDeleted();
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression de l'utilisateur.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={disabled || loading}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userEmail}</strong> ?
            <br />
            <br />
            Cette action est <strong>irréversible</strong> et supprimera définitivement :
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><strong>Profil utilisateur</strong> - Le compte sera complètement supprimé</li>
              <li><strong>Contenus créés</strong> - Articles de blog, journaux intimes, récits de vie, souhaits</li>
              <li><strong>Planning professionnel</strong> - Rendez-vous créés, clients, intervenants</li>
              <li><strong>Compte-rendus d'intervention</strong> - Tous les rapports rédigés</li>
              <li><strong>Messages</strong> - Communications dans l'espace proche-aidants</li>
              <li><strong>Groupes et invitations</strong> - Groupes créés et personnes invitées</li>
              <li><strong>Permissions et rôles</strong> - Tous les accès accordés</li>
            </ul>
            <br />
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Note :</strong> L'utilisateur pourra recréer un compte avec la même adresse email 
                et bénéficiera d'une nouvelle période d'essai gratuite.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteUser}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Suppression...' : 'Supprimer définitivement'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;
