import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface InvitationGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count: number;
  creator_name: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  added_at: string;
  profiles: {
    display_name: string | null;
    email: string;
  };
}

const InvitationGroups = () => {
  const { hasRole, user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<InvitationGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<InvitationGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      console.log('=== DEBUG InvitationGroups: Début du chargement des groupes ===');
      console.log('Utilisateur actuel:', user?.id);
      console.log('Est admin?', hasRole('admin'));

      const { data: groupsData, error } = await supabase
        .from('invitation_groups')
        .select('id, name, created_by, created_at')
        .order('created_at', { ascending: false });

      console.log('Requête invitation_groups - Données récupérées:', groupsData);
      console.log('Requête invitation_groups - Erreur:', error);

      if (error) throw error;

      // Récupérer les informations des créateurs et compter les membres
      const groupsWithDetails = await Promise.all(
        (groupsData || []).map(async (group) => {
          console.log(`Traitement du groupe: ${group.name} (${group.id})`);
          
          // Récupérer les infos du créateur
          const { data: creatorData, error: creatorError } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', group.created_by)
            .single();

          console.log(`Créateur du groupe ${group.name}:`, creatorData, 'Erreur:', creatorError);

          // Compter les membres
          const { count, error: countError } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          console.log(`Nombre de membres pour ${group.name}:`, count, 'Erreur:', countError);

          return {
            id: group.id,
            name: group.name,
            created_by: group.created_by,
            created_at: group.created_at,
            member_count: count || 0,
            creator_name: creatorData?.display_name || creatorData?.email || 'Utilisateur inconnu'
          };
        })
      );

      console.log('Groupes avec détails finaux:', groupsWithDetails);
      setGroups(groupsWithDetails);
    } catch (error: any) {
      console.error('Erreur lors du chargement des groupes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les groupes d'invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data: membersData, error } = await supabase
        .from('group_members')
        .select('id, user_id, role, added_at')
        .eq('group_id', groupId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      // Récupérer les profils des membres
      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', member.user_id)
            .single();

          return {
            ...member,
            profiles: {
              display_name: profileData?.display_name || null,
              email: profileData?.email || 'Email inconnu'
            }
          };
        })
      );

      setGroupMembers(membersWithProfiles);
    } catch (error: any) {
      console.error('Erreur lors du chargement des membres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les membres du groupe",
        variant: "destructive"
      });
    }
  };

  const addMemberToGroup = async () => {
    if (!selectedGroup || !newMemberEmail.trim()) return;

    try {
      // Chercher l'utilisateur par email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newMemberEmail.trim())
        .single();

      if (profileError || !profiles) {
        toast({
          title: "Erreur",
          description: "Utilisateur non trouvé avec cet email",
          variant: "destructive"
        });
        return;
      }

      // Ajouter au groupe
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: selectedGroup.id,
          user_id: profiles.id,
          role: 'guest'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Erreur",
            description: "Cet utilisateur fait déjà partie du groupe",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Membre ajouté",
        description: "L'utilisateur a été ajouté au groupe avec succès"
      });

      setNewMemberEmail('');
      setAddMemberDialogOpen(false);
      loadGroupMembers(selectedGroup.id);
      loadGroups(); // Recharger pour mettre à jour le compteur
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le membre au groupe",
        variant: "destructive"
      });
    }
  };

  const removeMemberFromGroup = async (memberId: string) => {
    if (!selectedGroup) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Membre supprimé",
        description: "Le membre a été retiré du groupe avec succès"
      });

      loadGroupMembers(selectedGroup.id);
      loadGroups(); // Recharger pour mettre à jour le compteur
    } catch (error: any) {
      console.error('Erreur lors de la suppression du membre:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le membre du groupe",
        variant: "destructive"
      });
    }
  };

  if (!hasRole('admin')) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Accès administrateur requis</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement des groupes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card 
            key={group.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setSelectedGroup(group);
              loadGroupMembers(group.id);
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{group.name}</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {group.member_count}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Créé par : {group.creator_name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(group.created_at).toLocaleDateString('fr-FR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Aucun groupe d'invitation trouvé</p>
            <p className="text-sm text-gray-400 mt-2">
              Les groupes d'invitation sont créés automatiquement lors de l'envoi d'invitations.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedGroup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Membres du groupe : {selectedGroup.name}</span>
              <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un membre
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un membre au groupe</DialogTitle>
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
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setAddMemberDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button onClick={addMemberToGroup}>
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupMembers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun membre dans ce groupe</p>
            ) : (
              <div className="space-y-2">
                {groupMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {member.profiles.display_name || member.profiles.email}
                      </p>
                      <p className="text-sm text-gray-500">{member.profiles.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role === 'admin' ? 'Administrateur' : 'Invité'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          Ajouté le {new Date(member.added_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMemberFromGroup(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvitationGroups;
