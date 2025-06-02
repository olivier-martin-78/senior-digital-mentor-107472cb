
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
      console.log('🔍 Chargement des utilisateurs invités - recherche plus exhaustive');

      // Chercher TOUTES les invitations créées par l'utilisateur, qu'elles soient utilisées ou non
      const { data: allInvitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .eq('invited_by', user?.id)
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('❌ Erreur lors de la récupération des invitations:', invitationsError);
        throw invitationsError;
      }

      console.log('📋 Toutes les invitations trouvées:', allInvitations?.length || 0);

      if (!allInvitations || allInvitations.length === 0) {
        console.log('⚠️ Aucune invitation trouvée pour cet utilisateur');
        setInvitedUsers([]);
        return;
      }

      const allInvitedUsers: InvitedUser[] = [];

      // Pour chaque invitation, rechercher l'utilisateur correspondant
      for (const invitation of allInvitations) {
        console.log('🔍 Traitement invitation:', invitation.email, 'utilisée:', !!invitation.used_at);

        // Chercher l'utilisateur par email dans les profils
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .eq('email', invitation.email)
          .single();

        if (profileError) {
          console.log('⚠️ Utilisateur non trouvé pour l\'email:', invitation.email);
          continue;
        }

        console.log('✅ Utilisateur trouvé:', userProfile.display_name || userProfile.email);

        // Ajouter l'utilisateur invité avec ses permissions
        const invitedUser: InvitedUser = {
          id: userProfile.id,
          user_id: userProfile.id,
          group_id: invitation.group_id || '',
          email: userProfile.email,
          display_name: userProfile.display_name,
          blog_access: Boolean(invitation.blog_access),
          life_story_access: Boolean(invitation.life_story_access),
          diary_access: Boolean(invitation.diary_access),
          wishes_access: Boolean(invitation.wishes_access)
        };

        // Éviter les doublons
        if (!allInvitedUsers.find(u => u.user_id === userProfile.id)) {
          allInvitedUsers.push(invitedUser);
        }
      }

      console.log('🎯 Utilisateurs invités finaux chargés:', allInvitedUsers.length);
      console.log('📝 Liste des utilisateurs:', allInvitedUsers.map(u => u.display_name || u.email));
      setInvitedUsers(allInvitedUsers);

    } catch (error) {
      console.error('❌ Erreur globale lors du chargement des utilisateurs invités:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = invitedUsers.find(u => u.user_id === userId);
    if (selectedUser) {
      setPermissions({
        blog_access: selectedUser.blog_access,
        life_story_access: selectedUser.life_story_access,
        diary_access: selectedUser.diary_access,
        wishes_access: selectedUser.wishes_access,
      });
    }
  };

  const handlePermissionChange = (permission: keyof typeof permissions, value: boolean) => {
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
      const selectedUser = invitedUsers.find(u => u.user_id === selectedUserId);
      if (!selectedUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Mettre à jour les permissions dans la table invitations pour cet email
      const { error } = await supabase
        .from('invitations')
        .update({
          blog_access: permissions.blog_access,
          life_story_access: permissions.life_story_access,
          diary_access: permissions.diary_access,
          wishes_access: permissions.wishes_access,
        })
        .eq('invited_by', user?.id)
        .eq('email', selectedUser.email);

      if (error) {
        console.error('❌ Erreur lors de la mise à jour des invitations:', error);
        throw error;
      }

      // Recharger les utilisateurs pour refléter les changements
      await loadInvitedUsers();
      
      toast.success('Permissions mises à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des permissions:', error);
      toast.error('Erreur lors de la sauvegarde des permissions');
    } finally {
      setIsSaving(false);
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
