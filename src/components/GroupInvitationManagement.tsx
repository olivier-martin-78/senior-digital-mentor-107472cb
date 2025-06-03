
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Mail, UserCheck, Clock, RefreshCw, UserPlus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { GroupInvitation } from '@/types/supabase';

interface GroupInvitationManagementProps {
  groupId: string;
  groupName: string;
  onUpdate: () => void;
}

const GroupInvitationManagement: React.FC<GroupInvitationManagementProps> = ({
  groupId,
  groupName,
  onUpdate
}) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    loadGroupInvitations();
  }, [groupId]);

  const loadGroupInvitations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('🔍 Chargement des invitations pour le groupe:', groupId);

      const { data: invitationsData, error } = await supabase
        .from('group_invitation')
        .select('*')
        .eq('group_id', groupId)
        .eq('inviter_id', user.id)
        .order('invitation_date', { ascending: false });

      if (error) throw error;

      console.log('📋 Invitations trouvées:', invitationsData?.length || 0);
      
      // Convertir le status string en union type attendu
      const typedInvitations = (invitationsData || []).map(invitation => ({
        ...invitation,
        status: invitation.status as 'pending' | 'confirmed'
      }));
      
      setInvitations(typedInvitations);

    } catch (error: any) {
      console.error('❌ Erreur chargement invitations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les invitations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExistingUser = async () => {
    if (!newMemberEmail.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un email",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('🔍 Recherche utilisateur avec email:', newMemberEmail);

    try {
      // Rechercher l'utilisateur par email
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .eq('email', newMemberEmail.trim())
        .maybeSingle();

      if (userError) {
        console.error('❌ Erreur recherche utilisateur:', userError);
        throw userError;
      }

      if (!existingUser) {
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun utilisateur trouvé avec cet email. Assurez-vous qu'il s'est bien inscrit.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Utilisateur trouvé:', existingUser);

      // Vérifier si l'utilisateur est déjà membre du groupe
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (memberCheckError) {
        console.error('❌ Erreur vérification membre:', memberCheckError);
        throw memberCheckError;
      }

      if (existingMember) {
        toast({
          title: "Déjà membre",
          description: "Cet utilisateur est déjà membre du groupe",
          variant: "destructive"
        });
        return;
      }

      // Ajouter l'utilisateur au groupe
      const { error: addError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: existingUser.id,
          role: 'guest'
        });

      if (addError) {
        console.error('❌ Erreur ajout membre:', addError);
        throw addError;
      }

      toast({
        title: "Membre ajouté",
        description: `${existingUser.display_name || existingUser.email} a été ajouté au groupe`
      });

      setNewMemberEmail('');
      setIsAddDialogOpen(false);
      onUpdate();

    } catch (error: any) {
      console.error('❌ Erreur ajout utilisateur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'ajout de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncPendingInvitations = async () => {
    console.log('🔄 Synchronisation des invitations en attente');
    
    try {
      setIsLoading(true);

      // Récupérer les invitations en attente pour ce groupe
      const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
      
      if (pendingInvitations.length === 0) {
        toast({
          title: "Aucune synchronisation nécessaire",
          description: "Toutes les invitations sont déjà confirmées"
        });
        return;
      }

      // Récupérer les utilisateurs confirmés
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) throw userError;

      let syncedCount = 0;

      for (const invitation of pendingInvitations) {
        // Chercher l'utilisateur confirmé avec cet email
        const user = userData?.users?.find((u: any) => 
          u.email === invitation.email && 
          u.email_confirmed_at !== null
        );

        if (user?.id) {
          console.log(`✅ Utilisateur trouvé: ${user.id} pour ${invitation.email}`);
          
          // Vérifier si l'utilisateur n'est pas déjà dans le groupe
          const { data: existingMember } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingMember) {
            // Ajouter l'utilisateur au groupe
            const { error: memberError } = await supabase
              .from('group_members')
              .insert({
                group_id: groupId,
                user_id: user.id,
                role: 'guest'
              });

            if (!memberError) {
              // Mettre à jour le statut de l'invitation
              const { error: updateError } = await supabase
                .from('group_invitation')
                .update({ 
                  status: 'confirmed',
                  invited_user_id: user.id
                })
                .eq('id', invitation.id);

              if (!updateError) {
                syncedCount++;
                console.log(`✅ Invitation confirmée pour ${invitation.email}`);
              }
            }
          } else {
            // L'utilisateur est déjà membre, juste mettre à jour le statut
            const { error: updateError } = await supabase
              .from('group_invitation')
              .update({ 
                status: 'confirmed',
                invited_user_id: user.id
              })
              .eq('id', invitation.id);

            if (!updateError) {
              syncedCount++;
              console.log(`✅ Statut mis à jour pour ${invitation.email}`);
            }
          }
        }
      }

      if (syncedCount > 0) {
        toast({
          title: "Synchronisation réussie",
          description: `${syncedCount} invitation(s) confirmée(s)`
        });
        loadGroupInvitations();
        onUpdate();
      } else {
        toast({
          title: "Aucune synchronisation",
          description: "Aucun utilisateur confirmé trouvé pour les invitations en attente"
        });
      }

    } catch (error: any) {
      console.error('❌ Erreur synchronisation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la synchronisation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (invitation: GroupInvitation) => {
    if (invitation.status === 'confirmed') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <UserCheck className="h-3 w-3 mr-1" />
          Confirmé
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-800">
        <Clock className="h-3 w-3 mr-1" />
        En attente
      </Badge>
    );
  };

  if (isLoading && invitations.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin h-6 w-6 border-2 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Invitations pour : {groupName}
          </span>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un membre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un membre existant</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="memberEmail">Email de l'utilisateur</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      L'utilisateur doit déjà être inscrit sur la plateforme
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={isLoading}
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleAddExistingUser} disabled={isLoading}>
                      {isLoading ? 'Ajout...' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              size="sm"
              onClick={syncPendingInvitations}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Synchroniser
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Aucune invitation envoyée pour ce groupe.
          </p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{invitation.email}</p>
                  <p className="text-sm text-gray-500">
                    Invité le {new Date(invitation.invitation_date).toLocaleDateString('fr-FR')}
                  </p>
                  {invitation.confirmation_date && (
                    <p className="text-xs text-green-600">
                      Confirmé le {new Date(invitation.confirmation_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(invitation)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupInvitationManagement;
