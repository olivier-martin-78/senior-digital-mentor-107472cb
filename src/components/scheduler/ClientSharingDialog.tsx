import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, UserMinus, Save } from 'lucide-react';
import { Client } from '@/types/appointments';
import ProfessionalUserSelector from './ProfessionalUserSelector';

interface ClientSharingDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface SharedUser {
  user_id: string;
  display_name: string;
  email: string;
}

const ClientSharingDialog: React.FC<ClientSharingDialogProps> = ({
  client,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [currentSharedUsers, setCurrentSharedUsers] = useState<SharedUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client && open) {
      fetchCurrentSharedUsers();
    }
  }, [client, open]);

  const fetchCurrentSharedUsers = async () => {
    if (!client) return;

    try {
      setLoading(true);
      console.log('Récupération des partages pour client:', client.id);
      
      // Étape 1: Récupérer les permissions
      const { data: permissions, error: permissionsError } = await supabase
        .from('user_client_permissions')
        .select('user_id')
        .eq('client_id', client.id);

      if (permissionsError) {
        console.error('Erreur permissions:', permissionsError);
        throw permissionsError;
      }

      console.log('Permissions trouvées:', permissions);

      if (!permissions || permissions.length === 0) {
        setCurrentSharedUsers([]);
        setSelectedUserIds([]);
        return;
      }

      // Étape 2: Récupérer les profils correspondants
      const userIds = permissions.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Erreur profils:', profilesError);
        throw profilesError;
      }

      console.log('Profils trouvés:', profiles);

      // Étape 3: Combiner les données
      const sharedUsers = (profiles || []).map(profile => ({
        user_id: profile.id,
        display_name: profile.display_name || 'Nom non défini',
        email: profile.email
      }));

      console.log('Utilisateurs partagés finaux:', sharedUsers);

      setCurrentSharedUsers(sharedUsers);
      setSelectedUserIds(sharedUsers.map(user => user.user_id));
    } catch (error) {
      console.error('Erreur lors de la récupération des partages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les partages actuels',
        variant: 'destructive'
      });
      // Initialiser avec des valeurs vides en cas d'erreur
      setCurrentSharedUsers([]);
      setSelectedUserIds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;

    try {
      setSaving(true);
      console.log('Début de la sauvegarde pour client:', client.id);
      console.log('Utilisateurs actuels:', currentSharedUsers.map(u => u.user_id));
      console.log('Utilisateurs sélectionnés:', selectedUserIds);

      // Récupérer les partages actuels
      const currentUserIds = currentSharedUsers.map(user => user.user_id);
      
      // Utilisateurs à ajouter
      const usersToAdd = selectedUserIds.filter(id => !currentUserIds.includes(id));
      console.log('Utilisateurs à ajouter:', usersToAdd);
      
      // Utilisateurs à supprimer
      const usersToRemove = currentUserIds.filter(id => !selectedUserIds.includes(id));
      console.log('Utilisateurs à supprimer:', usersToRemove);

      // Ajouter les nouveaux partages avec ON CONFLICT DO NOTHING
      if (usersToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('user_client_permissions')
          .upsert(
            usersToAdd.map(userId => ({
              user_id: userId,
              client_id: client.id
            })),
            { 
              onConflict: 'user_id,client_id',
              ignoreDuplicates: true
            }
          );

        if (insertError) {
          console.error('Erreur lors de l\'insertion:', insertError);
          throw insertError;
        }
      }

      // Supprimer les anciens partages
      if (usersToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_client_permissions')
          .delete()
          .eq('client_id', client.id)
          .in('user_id', usersToRemove);

        if (deleteError) {
          console.error('Erreur lors de la suppression:', deleteError);
          throw deleteError;
        }
      }

      toast({
        title: 'Succès',
        description: 'Partages mis à jour avec succès'
      });

      // Rafraîchir les données
      await fetchCurrentSharedUsers();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de sauvegarder les partages: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!client) return;

    try {
      const { error } = await supabase
        .from('user_client_permissions')
        .delete()
        .eq('client_id', client.id)
        .eq('user_id', userId);

      if (error) throw error;

      // Mettre à jour l'état local
      setCurrentSharedUsers(prev => prev.filter(user => user.user_id !== userId));
      setSelectedUserIds(prev => prev.filter(id => id !== userId));

      toast({
        title: 'Succès',
        description: 'Partage supprimé avec succès'
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer le partage: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager le client: {client.first_name} {client.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Partages actuels */}
          {currentSharedUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Actuellement partagé avec</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentSharedUsers.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveUser(user.user_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sélecteur d'utilisateurs */}
          <ProfessionalUserSelector
            selectedUserIds={selectedUserIds}
            onUsersSelected={setSelectedUserIds}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientSharingDialog;
