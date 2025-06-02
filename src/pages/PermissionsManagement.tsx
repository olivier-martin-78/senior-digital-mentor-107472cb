
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { UserCheck, Save, Users } from 'lucide-react';

interface InvitedUser {
  id: string;
  user_id: string;
  group_id: string;
  email: string;
  display_name: string | null;
  blog_access: boolean;
  life_story_access: boolean;
  diary_access: boolean;
  wishes_access: boolean;
}

const PermissionsManagement = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState({
    blog_access: false,
    life_story_access: false,
    diary_access: false,
    wishes_access: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isReader = hasRole('reader');

  useEffect(() => {
    if (!session || isReader) {
      navigate('/');
      return;
    }
    loadInvitedUsers();
  }, [session, isReader, navigate, user]);

  const loadInvitedUsers = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Début du chargement des utilisateurs invités');
      console.log('👤 Utilisateur actuel:', {
        userId: user?.id,
        userEmail: user?.email,
        isReader
      });

      // Étape 1: Chercher les groupes créés par l'utilisateur actuel
      console.log('📋 Étape 1: Recherche des groupes créés par l\'utilisateur');
      const { data: userGroups, error: groupsError } = await supabase
        .from('invitation_groups')
        .select('id, name, created_at')
        .eq('created_by', user?.id);

      if (groupsError) {
        console.error('❌ Erreur lors de la récupération des groupes:', groupsError);
        throw groupsError;
      }

      console.log('✅ Groupes trouvés:', userGroups);

      if (!userGroups || userGroups.length === 0) {
        console.log('⚠️ Aucun groupe trouvé pour cet utilisateur');
        setInvitedUsers([]);
        return;
      }

      // Étape 2: Pour chaque groupe, récupérer les membres
      console.log('📋 Étape 2: Recherche des membres des groupes');
      const allInvitedUsers: InvitedUser[] = [];

      for (const group of userGroups) {
        console.log(`🔍 Traitement du groupe: ${group.name} (${group.id})`);

        // Récupérer les membres du groupe
        const { data: groupMembers, error: membersError } = await supabase
          .from('group_members')
          .select('user_id, group_id, role')
          .eq('group_id', group.id)
          .eq('role', 'guest');

        if (membersError) {
          console.error(`❌ Erreur lors de la récupération des membres du groupe ${group.id}:`, membersError);
          continue;
        }

        console.log(`✅ Membres du groupe ${group.name}:`, groupMembers);

        // Pour chaque membre, récupérer ses informations de profil et permissions
        for (const member of groupMembers || []) {
          console.log(`👤 Traitement du membre: ${member.user_id}`);

          // Récupérer le profil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, display_name')
            .eq('id', member.user_id)
            .single();

          if (profileError) {
            console.error(`❌ Erreur lors de la récupération du profil ${member.user_id}:`, profileError);
            continue;
          }

          console.log(`✅ Profil récupéré pour ${member.user_id}:`, profile);

          // Récupérer les permissions d'invitation - CORRECTION: une seule invitation par groupe/inviteur
          const { data: invitations, error: invitationsError } = await supabase
            .from('invitations')
            .select('blog_access, life_story_access, diary_access, wishes_access')
            .eq('group_id', group.id)
            .eq('invited_by', user?.id)
            .not('used_at', 'is', null)
            .order('used_at', { ascending: false })
            .limit(1);

          if (invitationsError) {
            console.error(`❌ Erreur lors de la récupération des invitations pour le groupe ${group.id}:`, invitationsError);
            continue;
          }

          console.log(`✅ Invitations récupérées pour le groupe ${group.id}:`, invitations);

          // Utiliser les permissions de l'invitation la plus récente
          const invitation = invitations?.[0];
          if (invitation) {
            const invitedUser: InvitedUser = {
              id: member.user_id,
              user_id: member.user_id,
              group_id: group.id,
              email: profile.email || '',
              display_name: profile.display_name,
              blog_access: invitation.blog_access || false,
              life_story_access: invitation.life_story_access || false,
              diary_access: invitation.diary_access || false,
              wishes_access: invitation.wishes_access || false,
            };

            allInvitedUsers.push(invitedUser);
            console.log(`✅ Utilisateur invité ajouté avec permissions correctes:`, {
              user: invitedUser.display_name || invitedUser.email,
              permissions: {
                blog_access: invitedUser.blog_access,
                life_story_access: invitedUser.life_story_access,
                diary_access: invitedUser.diary_access,
                wishes_access: invitedUser.wishes_access
              }
            });
          }
        }
      }

      console.log('🎯 Résultat final - Utilisateurs invités:', allInvitedUsers);
      setInvitedUsers(allInvitedUsers);

    } catch (error) {
      console.error('❌ Erreur globale lors du chargement des utilisateurs invités:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
      console.log('🏁 Fin du chargement des utilisateurs invités');
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = invitedUsers.find(u => u.user_id === userId);
    if (selectedUser) {
      console.log('🔄 Sélection utilisateur:', {
        user: selectedUser.display_name || selectedUser.email,
        permissions: {
          blog_access: selectedUser.blog_access,
          life_story_access: selectedUser.life_story_access,
          diary_access: selectedUser.diary_access,
          wishes_access: selectedUser.wishes_access
        }
      });
      
      setPermissions({
        blog_access: selectedUser.blog_access,
        life_story_access: selectedUser.life_story_access,
        diary_access: selectedUser.diary_access,
        wishes_access: selectedUser.wishes_access,
      });
    }
  };

  const handlePermissionChange = (permission: keyof typeof permissions, value: boolean) => {
    console.log(`🔐 Changement permission ${permission}: ${value}`);
    setPermissions(prev => ({
      ...prev,
      [permission]: value,
    }));
  };

  const savePermissions = async () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    try {
      setIsSaving(true);
      console.log('💾 Début de la sauvegarde des permissions');

      const selectedUser = invitedUsers.find(u => u.user_id === selectedUserId);
      if (!selectedUser) {
        throw new Error('Utilisateur non trouvé');
      }

      console.log('👤 Utilisateur sélectionné:', selectedUser);
      console.log('🔐 Nouvelles permissions:', permissions);

      // Mettre à jour les permissions dans la table invitations
      const { error } = await supabase
        .from('invitations')
        .update({
          blog_access: permissions.blog_access,
          life_story_access: permissions.life_story_access,
          diary_access: permissions.diary_access,
          wishes_access: permissions.wishes_access,
        })
        .eq('invited_by', user?.id)
        .eq('group_id', selectedUser.group_id)
        .not('used_at', 'is', null);

      if (error) {
        console.error('❌ Erreur lors de la mise à jour des invitations:', error);
        throw error;
      }

      console.log('✅ Invitations mises à jour avec succès');

      // Synchroniser les permissions avec les tables de permissions
      await syncUserPermissions(selectedUserId, permissions);

      // Recharger les utilisateurs pour refléter les changements
      await loadInvitedUsers();
      
      toast.success('Permissions mises à jour avec succès');
      console.log('✅ Permissions mises à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des permissions:', error);
      toast.error('Erreur lors de la sauvegarde des permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const syncUserPermissions = async (userId: string, perms: typeof permissions) => {
    try {
      console.log('🔄 Synchronisation des permissions pour:', userId, perms);

      // Synchroniser les permissions pour les albums de blog
      if (perms.blog_access) {
        const { data: userAlbums } = await supabase
          .from('blog_albums')
          .select('id')
          .eq('author_id', user?.id);

        console.log('📚 Albums de blog trouvés:', userAlbums);

        if (userAlbums) {
          for (const album of userAlbums) {
            await supabase
              .from('album_permissions')
              .upsert({
                album_id: album.id,
                user_id: userId,
              }, {
                onConflict: 'album_id,user_id',
              });
          }
        }
      } else {
        // Supprimer les permissions d'album si l'accès blog est retiré
        const { data: userAlbums } = await supabase
          .from('blog_albums')
          .select('id')
          .eq('author_id', user?.id);

        if (userAlbums) {
          for (const album of userAlbums) {
            await supabase
              .from('album_permissions')
              .delete()
              .eq('album_id', album.id)
              .eq('user_id', userId);
          }
        }
      }

      // Synchroniser les permissions pour l'histoire de vie
      if (perms.life_story_access) {
        await supabase
          .from('life_story_permissions')
          .upsert({
            story_owner_id: user?.id,
            permitted_user_id: userId,
            permission_level: 'read',
            granted_by: user?.id,
          }, {
            onConflict: 'story_owner_id,permitted_user_id',
          });
      } else {
        await supabase
          .from('life_story_permissions')
          .delete()
          .eq('story_owner_id', user?.id)
          .eq('permitted_user_id', userId);
      }

      // Synchroniser les permissions pour le journal
      if (perms.diary_access) {
        await supabase
          .from('diary_permissions')
          .upsert({
            diary_owner_id: user?.id,
            permitted_user_id: userId,
            permission_level: 'read',
            granted_by: user?.id,
          }, {
            onConflict: 'diary_owner_id,permitted_user_id',
          });
      } else {
        await supabase
          .from('diary_permissions')
          .delete()
          .eq('diary_owner_id', user?.id)
          .eq('permitted_user_id', userId);
      }

      console.log('✅ Synchronisation des permissions terminée');

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des permissions:', error);
      throw error;
    }
  };

  const selectedUser = invitedUsers.find(u => u.user_id === selectedUserId);

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
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-2 flex items-center">
            <UserCheck className="w-8 h-8 mr-3" />
            Gestion des permissions
          </h1>
          <p className="text-gray-600">
            Modifiez les accès accordés aux personnes que vous avez invitées.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Sélection de l'utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Sélectionner un utilisateur
              </CardTitle>
              <CardDescription>
                Choisissez l'utilisateur dont vous souhaitez modifier les permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitedUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucun utilisateur invité trouvé.
                </p>
              ) : (
                <Select onValueChange={handleUserSelect} value={selectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {invitedUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.display_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Configuration des permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions d'accès</CardTitle>
              <CardDescription>
                {selectedUser 
                  ? `Configurez les accès pour ${selectedUser.display_name || selectedUser.email}`
                  : 'Sélectionnez un utilisateur pour configurer ses permissions'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedUserId ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="blog-access">Accès au blog (photos/vidéos)</Label>
                    <Switch
                      id="blog-access"
                      checked={permissions.blog_access}
                      onCheckedChange={(value) => handlePermissionChange('blog_access', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="life-story-access">Accès à l'histoire de vie</Label>
                    <Switch
                      id="life-story-access"
                      checked={permissions.life_story_access}
                      onCheckedChange={(value) => handlePermissionChange('life_story_access', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="diary-access">Accès au journal</Label>
                    <Switch
                      id="diary-access"
                      checked={permissions.diary_access}
                      onCheckedChange={(value) => handlePermissionChange('diary_access', value)}
                    />
                  </div>

                  {/* Masquer l'accès aux souhaits car ils sont publics par défaut */}

                  <div className="pt-4">
                    <Button 
                      onClick={savePermissions}
                      disabled={isSaving}
                      className="w-full bg-tranches-sage hover:bg-tranches-sage/90"
                    >
                      {isSaving ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                          Sauvegarde...
                        </span>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Enregistrer les modifications
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Sélectionnez un utilisateur pour voir et modifier ses permissions.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PermissionsManagement;
