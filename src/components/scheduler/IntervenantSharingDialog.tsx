
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, UserMinus, Save } from 'lucide-react';
import { Intervenant } from '@/types/appointments';
import ProfessionalUserSelector from './ProfessionalUserSelector';

interface IntervenantSharingDialogProps {
  intervenant: Intervenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface SharedUser {
  user_id: string;
  display_name: string;
  email: string;
}

const IntervenantSharingDialog: React.FC<IntervenantSharingDialogProps> = ({
  intervenant,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [currentSharedUsers, setCurrentSharedUsers] = useState<SharedUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (intervenant && open) {
      fetchCurrentSharedUsers();
    }
  }, [intervenant, open]);

  const fetchCurrentSharedUsers = async () => {
    if (!intervenant) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_intervenant_permissions')
        .select(`
          user_id,
          profiles!inner(display_name, email)
        `)
        .eq('intervenant_id', intervenant.id);

      if (error) throw error;

      const sharedUsers = data?.map(item => ({
        user_id: item.user_id,
        display_name: (item.profiles as any).display_name || 'Nom non défini',
        email: (item.profiles as any).email
      })) || [];

      setCurrentSharedUsers(sharedUsers);
      setSelectedUserIds(sharedUsers.map(user => user.user_id));
    } catch (error) {
      console.error('Erreur lors de la récupération des partages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les partages actuels',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!intervenant) return;

    try {
      setSaving(true);

      // Récupérer les partages actuels
      const currentUserIds = currentSharedUsers.map(user => user.user_id);
      
      // Utilisateurs à ajouter
      const usersToAdd = selectedUserIds.filter(id => !currentUserIds.includes(id));
      
      // Utilisateurs à supprimer
      const usersToRemove = currentUserIds.filter(id => !selectedUserIds.includes(id));

      // Ajouter les nouveaux partages
      if (usersToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('user_intervenant_permissions')
          .insert(
            usersToAdd.map(userId => ({
              user_id: userId,
              intervenant_id: intervenant.id
            }))
          );

        if (insertError) throw insertError;
      }

      // Supprimer les anciens partages
      if (usersToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_intervenant_permissions')
          .delete()
          .eq('intervenant_id', intervenant.id)
          .in('user_id', usersToRemove);

        if (deleteError) throw deleteError;
      }

      toast({
        title: 'Succès',
        description: 'Partages mis à jour avec succès'
      });

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
    if (!intervenant) return;

    try {
      const { error } = await supabase
        .from('user_intervenant_permissions')
        .delete()
        .eq('intervenant_id', intervenant.id)
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

  if (!intervenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager l'intervenant: {intervenant.first_name} {intervenant.last_name}
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

export default IntervenantSharingDialog;
