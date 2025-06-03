
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserMinus, UserPlus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  added_at: string;
  profiles: {
    display_name: string | null;
    email: string;
  } | null;
}

interface InvitedUserManagementProps {
  groupId: string;
  groupName: string;
  members: GroupMember[];
  onMembersUpdate: () => void;
}

const InvitedUserManagement: React.FC<InvitedUserManagementProps> = ({
  groupId,
  groupName,
  members,
  onMembersUpdate
}) => {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      // Marquer l'invitation comme utilisée si elle existe
      const { error: updateInvitationError } = await supabase
        .from('invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('email', newMemberEmail.trim())
        .eq('invited_by', user?.id)
        .is('used_at', null);

      if (updateInvitationError) {
        console.warn('⚠️ Erreur mise à jour invitation (peut être normale):', updateInvitationError);
      }

      toast({
        title: "Membre ajouté",
        description: `${existingUser.display_name || existingUser.email} a été ajouté au groupe`
      });

      setNewMemberEmail('');
      setIsAddDialogOpen(false);
      onMembersUpdate();

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

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberEmail} du groupe ?`)) {
      return;
    }

    setIsLoading(true);
    console.log('🗑️ Suppression membre:', memberId);

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Membre retiré",
        description: `${memberEmail} a été retiré du groupe`
      });

      onMembersUpdate();

    } catch (error: any) {
      console.error('❌ Erreur suppression membre:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gestion des membres : {groupName}</span>
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Aucun membre dans ce groupe.
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">
                    {member.profiles?.display_name || 'Nom non disponible'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {member.profiles?.email || 'Email non disponible'}
                  </p>
                  {!member.profiles && (
                    <p className="text-xs text-red-500">
                      ⚠️ Profil introuvable (ID: {member.user_id})
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Ajouté le {new Date(member.added_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                    {member.role === 'admin' ? 'Administrateur' : 'Invité'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id, member.profiles?.email || 'Utilisateur inconnu')}
                    disabled={isLoading}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvitedUserManagement;
