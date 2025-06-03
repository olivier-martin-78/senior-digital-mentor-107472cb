
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Mail, Calendar, Clock, UserCheck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import InviteUserDialog from '@/components/InviteUserDialog';
import InvitedUserManagement from '@/components/InvitedUserManagement';
import GroupInvitationManagement from '@/components/GroupInvitationManagement';
import { GroupInvitation } from '@/types/supabase';

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

const MyInvitationGroups = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<InvitationGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<InvitationGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isReader = hasRole('reader');

  useEffect(() => {
    if (!session || isReader) {
      navigate('/');
      return;
    }
    loadMyGroups();
  }, [session, isReader, navigate, user]);

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
        .select('id, user_id, role, added_at')
        .eq('group_id', groupId)
        .order('added_at', { ascending: false });

      if (membersError) throw membersError;

      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member) => {
          let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', member.user_id)
            .maybeSingle();

          if (!profile && profileError?.code === 'PGRST116') {
            console.log(`📝 Tentative de récréation du profil pour: ${member.user_id}`);
            
            try {
              const { data: authData } = await supabase.auth.admin.getUserById(member.user_id);
              
              if (authData.user) {
                const { error: createError } = await supabase
                  .from('profiles')
                  .insert({
                    id: member.user_id,
                    email: authData.user.email || 'Email non disponible',
                    display_name: authData.user.user_metadata?.display_name || 
                                  authData.user.user_metadata?.full_name ||
                                  null
                  });

                if (!createError) {
                  const { data: newProfile } = await supabase
                    .from('profiles')
                    .select('display_name, email')
                    .eq('id', member.user_id)
                    .maybeSingle();
                  
                  profile = newProfile;
                }
              }
            } catch (authError) {
              console.error('❌ Erreur récupération auth.users:', authError);
            }
          } else if (profileError && profileError.code !== 'PGRST116') {
            console.error('❌ Erreur chargement profil:', profileError);
          }

          return {
            ...member,
            profiles: profile
          };
        })
      );

      console.log('📋 Membres trouvés:', membersWithProfiles.length);
      setGroupMembers(membersWithProfiles);
    } catch (error: any) {
      console.error('Erreur lors du chargement des membres:', error);
      toast.error('Erreur lors du chargement des membres du groupe');
    }
  };

  const loadGroupInvitations = async (groupId: string) => {
    try {
      console.log('🔍 Chargement des invitations du groupe:', groupId);
      
      const { data: invitationsData, error } = await supabase
        .from('group_invitation')
        .select('*')
        .eq('group_id', groupId)
        .eq('inviter_id', user?.id)
        .order('invitation_date', { ascending: false });

      if (error) throw error;

      console.log('📋 Invitations trouvées:', invitationsData?.length || 0);
      setGroupInvitations(invitationsData || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des invitations:', error);
      toast.error('Erreur lors du chargement des invitations');
    }
  };

  const handleGroupSelect = (group: InvitationGroup) => {
    setSelectedGroup(group);
    loadGroupMembers(group.id);
    loadGroupInvitations(group.id);
  };

  const handleUpdate = () => {
    loadMyGroups();
    if (selectedGroup) {
      loadGroupMembers(selectedGroup.id);
      loadGroupInvitations(selectedGroup.id);
    }
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

  // Compter les invitations en attente
  const pendingInvitationsCount = groupInvitations.filter(inv => inv.status === 'pending').length;
  const confirmedInvitationsCount = groupInvitations.filter(inv => inv.status === 'confirmed').length;

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
              <InviteUserDialog />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Résumé des invitations pour le groupe sélectionné */}
          {selectedGroup && groupInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Résumé des invitations : {selectedGroup.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-3 border rounded-lg bg-amber-50">
                    <Clock className="w-5 h-5 text-amber-600 mr-2" />
                    <div>
                      <p className="font-medium">{pendingInvitationsCount}</p>
                      <p className="text-sm text-gray-600">En attente</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 border rounded-lg bg-green-50">
                    <UserCheck className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium">{confirmedInvitationsCount}</p>
                      <p className="text-sm text-gray-600">Confirmées</p>
                    </div>
                  </div>
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

          {groups.length === 0 && (
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

          {/* Gestion des invitations et membres du groupe sélectionné */}
          {selectedGroup && (
            <div className="space-y-6">
              <GroupInvitationManagement 
                groupId={selectedGroup.id}
                groupName={selectedGroup.name}
                onUpdate={handleUpdate}
              />
              
              <InvitedUserManagement 
                groupId={selectedGroup.id}
                groupName={selectedGroup.name}
                members={groupMembers}
                onMembersUpdate={handleUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyInvitationGroups;
