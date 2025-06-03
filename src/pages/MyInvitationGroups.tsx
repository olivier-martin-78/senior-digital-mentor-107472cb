
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Mail, Calendar, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import InviteUserDialog from '@/components/InviteUserDialog';
import InvitedUserManagement from '@/components/InvitedUserManagement';

interface InvitationGroup {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
}

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

interface PendingInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  blog_access: boolean;
  life_story_access: boolean;
  diary_access: boolean;
  wishes_access: boolean;
}

const MyInvitationGroups = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<InvitationGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<InvitationGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isReader = hasRole('reader');

  useEffect(() => {
    if (!session || isReader) {
      navigate('/');
      return;
    }
    loadMyGroups();
  }, [session, isReader, navigate, user]);

  const syncPendingInvitations = async () => {
    console.log('🔄 Synchronisation forcée des invitations en attente');
    
    try {
      // Récupérer toutes les invitations non utilisées de l'utilisateur
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('invitations')
        .select('id, email, invited_by, group_id')
        .eq('invited_by', user?.id)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString());

      if (invitationsError) throw invitationsError;

      let updatedCount = 0;

      for (const invitation of invitationsData || []) {
        console.log(`🔍 Vérification forcée pour: ${invitation.email}`);
        
        // Chercher l'utilisateur inscrit
        const { data: registeredUser, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', invitation.email)
          .maybeSingle();

        if (userError) {
          console.error('❌ Erreur recherche utilisateur:', userError);
          continue;
        }

        if (registeredUser) {
          console.log(`✅ Utilisateur trouvé: ${invitation.email}, ID: ${registeredUser.id}`);
          
          // Vérifier si l'email est confirmé
          const { data: isConfirmed, error: confirmError } = await supabase
            .rpc('is_email_confirmed', { user_id: registeredUser.id });
          
          if (confirmError) {
            console.error('❌ Erreur vérification confirmation:', confirmError);
            continue;
          }

          if (isConfirmed) {
            console.log(`📧 Email confirmé pour ${invitation.email}`);
            
            // Vérifier si l'utilisateur est déjà dans le groupe
            const { data: existingMember, error: memberError } = await supabase
              .from('group_members')
              .select('id')
              .eq('group_id', invitation.group_id)
              .eq('user_id', registeredUser.id)
              .maybeSingle();

            if (memberError) {
              console.error('❌ Erreur vérification membre:', memberError);
              continue;
            }

            if (!existingMember && invitation.group_id) {
              // Ajouter au groupe
              console.log(`➕ Ajout au groupe: ${invitation.group_id}`);
              const { error: addError } = await supabase
                .from('group_members')
                .insert({
                  group_id: invitation.group_id,
                  user_id: registeredUser.id,
                  role: 'guest'
                });

              if (addError) {
                console.error('❌ Erreur ajout groupe:', addError);
                continue;
              }
            }

            // Marquer l'invitation comme utilisée
            const { error: updateError } = await supabase
              .from('invitations')
              .update({ used_at: new Date().toISOString() })
              .eq('id', invitation.id);

            if (updateError) {
              console.error('❌ Erreur mise à jour invitation:', updateError);
            } else {
              updatedCount++;
              console.log(`✅ Invitation marquée comme utilisée: ${invitation.email}`);
            }
          }
        }
      }

      if (updatedCount > 0) {
        toast.success(`${updatedCount} invitation(s) synchronisée(s)`);
        loadMyGroups(); // Recharger les données
      } else {
        toast.info('Aucune invitation à synchroniser');
      }

    } catch (error: any) {
      console.error('❌ Erreur synchronisation:', error);
      toast.error('Erreur lors de la synchronisation');
    }
  };

  const loadMyGroups = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Chargement des groupes créés par l\'utilisateur');

      // Charger les groupes créés par l'utilisateur
      const { data: groupsData, error: groupsError } = await supabase
        .from('invitation_groups')
        .select('id, name, created_at')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Compter les membres pour chaque groupe
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            member_count: count || 0
          };
        })
      );

      setGroups(groupsWithCounts);

      // Charger uniquement les vraies invitations en attente
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('invitations')
        .select('id, email, first_name, last_name, created_at, blog_access, life_story_access, diary_access, wishes_access')
        .eq('invited_by', user?.id)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;

      // Filtrer pour ne garder que les vraies invitations en attente
      const reallyPendingInvitations = [];
      if (invitationsData) {
        for (const invitation of invitationsData) {
          // Vérifier si l'utilisateur s'est inscrit
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', invitation.email)
            .maybeSingle();

          if (!existingUser) {
            // Pas encore inscrit, vraiment en attente
            reallyPendingInvitations.push(invitation);
          } else {
            // Inscrit, vérifier si email confirmé
            const { data: isConfirmed } = await supabase
              .rpc('is_email_confirmed', { user_id: existingUser.id });
            
            if (!isConfirmed) {
              // Email pas confirmé, garder en attente
              reallyPendingInvitations.push(invitation);
            }
            // Si confirmé, ne pas garder (sera traité par la synchronisation)
          }
        }
      }

      console.log(`📊 Vraies invitations en attente: ${reallyPendingInvitations.length}`);
      setPendingInvitations(reallyPendingInvitations);

    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des groupes:', error);
      toast.error('Erreur lors du chargement des groupes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      console.log('🔍 Chargement des membres du groupe:', groupId);
      
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id, 
          user_id, 
          role, 
          added_at,
          profiles:user_id (
            display_name,
            email
          )
        `)
        .eq('group_id', groupId)
        .order('added_at', { ascending: false });

      if (membersError) throw membersError;

      console.log('📋 Membres trouvés:', membersData?.length || 0);
      console.log('👥 Détails des membres:', membersData);
      
      setGroupMembers(membersData || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des membres:', error);
      toast.error('Erreur lors du chargement des membres du groupe');
    }
  };

  const handleGroupSelect = (group: InvitationGroup) => {
    setSelectedGroup(group);
    loadGroupMembers(group.id);
  };

  const getPermissionsList = (invitation: PendingInvitation) => {
    const permissions = [];
    if (invitation.blog_access) permissions.push('Blog');
    if (invitation.life_story_access) permissions.push('Histoire de vie');
    if (invitation.diary_access) permissions.push('Journal');
    if (invitation.wishes_access) permissions.push('Souhaits');
    return permissions.length > 0 ? permissions.join(', ') : 'Aucun accès';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif text-tranches-charcoal mb-2 flex items-center">
                <Users className="w-8 h-8 mr-3" />
                Mes groupes d'invitation
              </h1>
              <p className="text-gray-600">
                Gérez les personnes que vous avez invitées et leurs accès à votre contenu.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={syncPendingInvitations}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Synchroniser
              </Button>
              <InviteUserDialog />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Invitations en attente */}
          {pendingInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Invitations en attente ({pendingInvitations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-amber-50 border-amber-200">
                      <div>
                        <p className="font-medium">
                          {invitation.first_name} {invitation.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{invitation.email}</p>
                        <p className="text-xs text-gray-400">
                          Accès : {getPermissionsList(invitation)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                          En attente
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          Invité le {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mes groupes */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card 
                key={group.id} 
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  selectedGroup?.id === group.id ? 'ring-2 ring-tranches-sage' : ''
                }`}
                onClick={() => handleGroupSelect(group)}
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
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    Créé le {new Date(group.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {groups.length === 0 && pendingInvitations.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune invitation envoyée
                </h3>
                <p className="text-gray-500 mb-4">
                  Commencez par inviter des personnes à voir votre contenu.
                </p>
                <InviteUserDialog />
              </CardContent>
            </Card>
          )}

          {/* Gestion des membres du groupe sélectionné */}
          {selectedGroup && (
            <InvitedUserManagement 
              groupId={selectedGroup.id}
              groupName={selectedGroup.name}
              members={groupMembers}
              onMembersUpdate={() => {
                loadGroupMembers(selectedGroup.id);
                loadMyGroups(); // Recharger aussi les compteurs de groupes
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyInvitationGroups;
