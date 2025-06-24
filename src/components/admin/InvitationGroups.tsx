
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Users, Clock, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface InvitationGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count: number;
  pending_invitations_count: number;
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

interface PendingInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  status: string;
}

interface InvitationGroupsProps {
  onDataChange?: () => void;
}

export interface InvitationGroupsRef {
  loadGroups: () => void;
}

const InvitationGroups = forwardRef<InvitationGroupsRef, InvitationGroupsProps>(
  ({ onDataChange }, ref) => {
    const { hasRole, user } = useAuth();
    const { toast } = useToast();
    const [groups, setGroups] = useState<InvitationGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<InvitationGroup | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

    const loadGroups = async () => {
      try {
        setLoading(true);
        console.log('=== DEBUG InvitationGroups: Début du chargement des groupes ===');
        console.log('Utilisateur actuel:', user?.id);
        console.log('Est admin?', hasRole('admin'));

        // Modifier la requête pour charger soit tous les groupes (admin) soit les groupes de l'utilisateur
        let query = supabase
          .from('invitation_groups')
          .select('id, name, created_by, created_at')
          .order('created_at', { ascending: false });

        // Si l'utilisateur n'est pas admin, filtrer par ses groupes
        if (!hasRole('admin')) {
          query = query.eq('created_by', user?.id);
        }

        const { data: groupsData, error } = await query;

        console.log('Requête invitation_groups - Données récupérées:', groupsData);
        console.log('Requête invitation_groups - Erreur:', error);

        if (error) throw error;

        // Récupérer les informations des créateurs et compter les membres + invitations en attente
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

            // Compter les membres confirmés
            const { count: membersCount, error: countError } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);

            console.log(`Nombre de membres confirmés pour ${group.name}:`, membersCount, 'Erreur:', countError);

            // Compter les invitations en attente (non utilisées)
            const { count: pendingCount, error: pendingError } = await supabase
              .from('invitations')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .is('used_at', null);

            console.log(`Nombre d'invitations en attente pour ${group.name}:`, pendingCount, 'Erreur:', pendingError);

            return {
              id: group.id,
              name: group.name,
              created_by: group.created_by,
              created_at: group.created_at,
              member_count: membersCount || 0,
              pending_invitations_count: pendingCount || 0,
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

    useImperativeHandle(ref, () => ({
      loadGroups
    }));

    useEffect(() => {
      loadGroups();
    }, []);

    const loadGroupMembers = async (groupId: string) => {
      try {
        console.log('=== DEBUG loadGroupMembers: Début du chargement des membres ===');
        console.log('Group ID:', groupId);

        // Charger les membres du groupe d'abord
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select('id, user_id, role, added_at')
          .eq('group_id', groupId)
          .order('added_at', { ascending: false });

        console.log('Membres récupérés:', membersData);
        console.log('Erreur membres:', membersError);

        if (membersError) throw membersError;

        if (!membersData || membersData.length === 0) {
          console.log('Aucun membre trouvé pour ce groupe');
          setGroupMembers([]);
        } else {
          // Récupérer les profils pour chaque membre
          const membersWithProfiles = await Promise.all(
            membersData.map(async (member) => {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('display_name, email')
                .eq('id', member.user_id)
                .single();

              console.log(`Profil pour ${member.user_id}:`, profileData, 'Erreur:', profileError);

              return {
                id: member.id,
                user_id: member.user_id,
                role: member.role,
                added_at: member.added_at,
                profiles: {
                  display_name: profileData?.display_name || null,
                  email: profileData?.email || 'Email inconnu'
                }
              };
            })
          );

          console.log('Membres avec profils:', membersWithProfiles);
          setGroupMembers(membersWithProfiles);
        }

        // Charger les invitations en attente (non utilisées ET non confirmées)
        const { data: invitationsData, error: invitationsError } = await supabase
          .from('invitations')
          .select('id, email, first_name, last_name, created_at')
          .eq('group_id', groupId)
          .is('used_at', null)
          .order('created_at', { ascending: false });

        console.log('Invitations en attente récupérées:', invitationsData);
        console.log('Erreur invitations:', invitationsError);

        if (invitationsError) throw invitationsError;

        // NOUVEAU: Filtrer les invitations pour exclure celles dont l'email correspond à un membre confirmé
        const memberEmails = membersData ? membersData.map(m => {
          // Nous devons récupérer l'email du profil correspondant
          return null; // Pour l'instant, on va faire une autre approche
        }) : [];

        // Récupérer les emails des membres confirmés pour les filtrer des invitations en attente
        const confirmedEmails = new Set<string>();
        if (membersData && membersData.length > 0) {
          for (const member of membersData) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', member.user_id)
              .single();
            
            if (profileData?.email) {
              confirmedEmails.add(profileData.email);
              console.log(`Email confirmé ajouté: ${profileData.email}`);
            }
          }
        }

        // Filtrer les invitations pour exclure les emails déjà confirmés
        const filteredInvitations = (invitationsData || []).filter(invitation => {
          const isAlreadyConfirmed = confirmedEmails.has(invitation.email);
          console.log(`Invitation ${invitation.email} - Déjà confirmée: ${isAlreadyConfirmed}`);
          return !isAlreadyConfirmed;
        });

        // Ajouter le statut pour les invitations en attente filtrées
        const pendingInvitationsWithStatus = filteredInvitations.map(invitation => ({
          ...invitation,
          status: 'pending'
        }));

        console.log('Invitations en attente filtrées:', pendingInvitationsWithStatus);
        setPendingInvitations(pendingInvitationsWithStatus);

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
        if (onDataChange) onDataChange();
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
        if (onDataChange) onDataChange();
      } catch (error: any) {
        console.error('Erreur lors de la suppression du membre:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le membre du groupe",
          variant: "destructive"
        });
      }
    };

    const removeInvitation = async (invitationId: string) => {
      if (!selectedGroup) return;

      try {
        const { error } = await supabase
          .from('invitations')
          .delete()
          .eq('id', invitationId);

        if (error) throw error;

        toast({
          title: "Invitation supprimée",
          description: "L'invitation a été supprimée avec succès"
        });

        loadGroupMembers(selectedGroup.id);
        loadGroups(); // Recharger pour mettre à jour le compteur
        if (onDataChange) onDataChange();
      } catch (error: any) {
        console.error('Erreur lors de la suppression de l\'invitation:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'invitation",
          variant: "destructive"
        });
      }
    };

    // Supprimer la vérification de rôle admin - accessible à tous les utilisateurs authentifiés
    if (!user) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Vous devez être connecté pour accéder à cette fonctionnalité</p>
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
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {group.member_count}
                    </Badge>
                    {group.pending_invitations_count > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {group.pending_invitations_count}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Créé par : {group.creator_name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(group.created_at).toLocaleDateString('fr-FR')}
                </p>
                {group.pending_invitations_count > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {group.pending_invitations_count} invitation(s) en attente
                  </p>
                )}
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
                {/* Permettre l'ajout de membres seulement si l'utilisateur est le créateur du groupe ou admin */}
                {(selectedGroup.created_by === user?.id || hasRole('admin')) && (
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
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groupMembers.length === 0 && pendingInvitations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun membre ni invitation en attente dans ce groupe</p>
              ) : (
                <div className="space-y-4">
                  {/* Membres confirmés */}
                  {groupMembers.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Membres actifs ({groupMembers.length})
                      </h4>
                      <div className="space-y-2">
                        {groupMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
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
                            {/* Permettre la suppression seulement si l'utilisateur est le créateur du groupe ou admin */}
                            {(selectedGroup.created_by === user?.id || hasRole('admin')) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMemberFromGroup(member.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invitations en attente */}
                  {pendingInvitations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Invitations en attente ({pendingInvitations.length})
                      </h4>
                      <div className="space-y-2">
                        {pendingInvitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                            <div>
                              <p className="font-medium">
                                {invitation.first_name} {invitation.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{invitation.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  En attente
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  Invité le {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                            {/* Permettre la suppression seulement si l'utilisateur est le créateur du groupe ou admin */}
                            {(selectedGroup.created_by === user?.id || hasRole('admin')) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInvitation(invitation.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

InvitationGroups.displayName = 'InvitationGroups';

export default InvitationGroups;
