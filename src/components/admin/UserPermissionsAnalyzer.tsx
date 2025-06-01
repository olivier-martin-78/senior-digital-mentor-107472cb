
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, User, CheckCircle, XCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
}

interface UserPermissionData {
  directPermissions: {
    albums: any[];
    lifeStories: any[];
    diary: any[];
  };
  inheritedPermissions: {
    groups: any[];
    invitations: any[];
  };
  expectedAccess: {
    albums: any[];
    lifeStories: any[];
    diary: any[];
  };
  missingPermissions: {
    albums: any[];
    lifeStories: any[];
    diary: any[];
  };
}

interface UserPermissionsAnalyzerProps {
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
}

const UserPermissionsAnalyzer: React.FC<UserPermissionsAnalyzerProps> = ({
  selectedUserId,
  onUserChange
}) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [permissionData, setPermissionData] = useState<UserPermissionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      analyzeUserPermissions(selectedUserId);
    } else {
      setPermissionData(null);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .order('display_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    }
  };

  const analyzeUserPermissions = async (userId: string) => {
    setAnalyzing(true);
    console.log('🔍 Analyse des permissions pour utilisateur:', userId);

    try {
      // Récupérer les permissions directes
      const [albumPermissions, lifeStoryPermissions, diaryPermissions] = await Promise.all([
        supabase.from('album_permissions').select(`
          *,
          blog_albums(id, name, author_id, profiles!blog_albums_author_id_fkey(display_name, email))
        `).eq('user_id', userId),
        
        supabase.from('life_story_permissions').select(`
          *,
          story_owner:profiles!life_story_permissions_story_owner_id_fkey(display_name, email)
        `).eq('permitted_user_id', userId),
        
        supabase.from('diary_permissions').select(`
          *,
          diary_owner:profiles!diary_permissions_diary_owner_id_fkey(display_name, email)
        `).eq('permitted_user_id', userId)
      ]);

      // Récupérer les groupes et invitations
      const { data: groupMemberships } = await supabase
        .from('group_members')
        .select(`
          *,
          invitation_groups(
            id, name, created_by,
            creator:profiles!invitation_groups_created_by_fkey(display_name, email)
          )
        `)
        .eq('user_id', userId);

      // Récupérer les invitations pour cet utilisateur
      const userProfile = users.find(u => u.id === userId);
      const { data: invitations } = await supabase
        .from('invitations')
        .select(`
          *,
          inviter:profiles!invitations_invited_by_fkey(display_name, email)
        `)
        .eq('email', userProfile?.email)
        .not('used_at', 'is', null);

      // Calculer l'accès attendu basé sur les invitations
      const expectedAccess = {
        albums: [] as any[],
        lifeStories: [] as any[],
        diary: [] as any[]
      };

      if (invitations) {
        for (const invitation of invitations) {
          if (invitation.blog_access) {
            const { data: inviterAlbums } = await supabase
              .from('blog_albums')
              .select('*')
              .eq('author_id', invitation.invited_by);
            expectedAccess.albums.push(...(inviterAlbums || []));
          }
          
          if (invitation.life_story_access) {
            const { data: inviterLifeStories } = await supabase
              .from('life_stories')
              .select('*')
              .eq('user_id', invitation.invited_by);
            expectedAccess.lifeStories.push(...(inviterLifeStories || []));
          }
          
          if (invitation.diary_access) {
            expectedAccess.diary.push({
              owner_id: invitation.invited_by,
              owner_email: invitation.inviter?.email
            });
          }
        }
      }

      // Calculer les permissions manquantes
      const currentAlbumIds = albumPermissions.data?.map(p => p.album_id) || [];
      const currentLifeStoryOwners = lifeStoryPermissions.data?.map(p => p.story_owner_id) || [];
      const currentDiaryOwners = diaryPermissions.data?.map(p => p.diary_owner_id) || [];

      const missingPermissions = {
        albums: expectedAccess.albums.filter(album => !currentAlbumIds.includes(album.id)),
        lifeStories: expectedAccess.lifeStories.filter(story => !currentLifeStoryOwners.includes(story.user_id)),
        diary: expectedAccess.diary.filter(diary => !currentDiaryOwners.includes(diary.owner_id))
      };

      setPermissionData({
        directPermissions: {
          albums: albumPermissions.data || [],
          lifeStories: lifeStoryPermissions.data || [],
          diary: diaryPermissions.data || []
        },
        inheritedPermissions: {
          groups: groupMemberships || [],
          invitations: invitations || []
        },
        expectedAccess,
        missingPermissions
      });

      console.log('🔍 Analyse terminée:', {
        directPermissions: {
          albums: albumPermissions.data?.length || 0,
          lifeStories: lifeStoryPermissions.data?.length || 0,
          diary: diaryPermissions.data?.length || 0
        },
        expectedAccess: {
          albums: expectedAccess.albums.length,
          lifeStories: expectedAccess.lifeStories.length,
          diary: expectedAccess.diary.length
        },
        missingPermissions: {
          albums: missingPermissions.albums.length,
          lifeStories: missingPermissions.lifeStories.length,
          diary: missingPermissions.diary.length
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser les permissions de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const fixMissingPermissions = async () => {
    if (!selectedUserId || !permissionData) return;

    setLoading(true);
    try {
      let fixed = 0;

      // Corriger les permissions d'albums manquantes
      for (const album of permissionData.missingPermissions.albums) {
        const { error } = await supabase
          .from('album_permissions')
          .insert({
            album_id: album.id,
            user_id: selectedUserId
          });
        if (!error) fixed++;
      }

      // Corriger les permissions d'histoires de vie manquantes
      for (const story of permissionData.missingPermissions.lifeStories) {
        const { error } = await supabase
          .from('life_story_permissions')
          .insert({
            story_owner_id: story.user_id,
            permitted_user_id: selectedUserId,
            permission_level: 'read',
            granted_by: story.user_id
          });
        if (!error) fixed++;
      }

      // Corriger les permissions de journal manquantes
      for (const diary of permissionData.missingPermissions.diary) {
        const { error } = await supabase
          .from('diary_permissions')
          .insert({
            diary_owner_id: diary.owner_id,
            permitted_user_id: selectedUserId,
            permission_level: 'read',
            granted_by: diary.owner_id
          });
        if (!error) fixed++;
      }

      toast({
        title: "Permissions corrigées",
        description: `${fixed} permissions ont été ajoutées avec succès`
      });

      // Recharger l'analyse
      await analyzeUserPermissions(selectedUserId);

    } catch (error) {
      console.error('Erreur lors de la correction:', error);
      toast({
        title: "Erreur de correction",
        description: "Impossible de corriger toutes les permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Sélecteur d'utilisateur */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner un utilisateur
          </label>
          <Select value={selectedUserId || ''} onValueChange={(value) => onUserChange(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un utilisateur..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{user.display_name || user.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedUserId && (
          <Button
            onClick={() => analyzeUserPermissions(selectedUserId)}
            disabled={analyzing}
            variant="outline"
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réanalyser
              </>
            )}
          </Button>
        )}
      </div>

      {/* Résultats de l'analyse */}
      {selectedUser && permissionData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Analyse pour {selectedUser.display_name || selectedUser.email}
            </h3>
            {(permissionData.missingPermissions.albums.length > 0 || 
              permissionData.missingPermissions.lifeStories.length > 0 || 
              permissionData.missingPermissions.diary.length > 0) && (
              <Button
                onClick={fixMissingPermissions}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Correction...
                  </>
                ) : (
                  'Corriger les permissions manquantes'
                )}
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Permissions actuelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Permissions actuelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Albums ({permissionData.directPermissions.albums.length})</h4>
                  {permissionData.directPermissions.albums.map((perm, idx) => (
                    <Badge key={idx} variant="outline" className="mr-2 mb-1">
                      {perm.blog_albums?.name || 'Album inconnu'}
                    </Badge>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Histoires de vie ({permissionData.directPermissions.lifeStories.length})</h4>
                  {permissionData.directPermissions.lifeStories.map((perm, idx) => (
                    <Badge key={idx} variant="outline" className="mr-2 mb-1">
                      {perm.story_owner?.display_name || perm.story_owner?.email || 'Propriétaire inconnu'}
                    </Badge>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Journaux ({permissionData.directPermissions.diary.length})</h4>
                  {permissionData.directPermissions.diary.map((perm, idx) => (
                    <Badge key={idx} variant="outline" className="mr-2 mb-1">
                      {perm.diary_owner?.display_name || perm.diary_owner?.email || 'Propriétaire inconnu'}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permissions manquantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Permissions manquantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Albums manqués ({permissionData.missingPermissions.albums.length})</h4>
                  {permissionData.missingPermissions.albums.map((album, idx) => (
                    <Badge key={idx} variant="destructive" className="mr-2 mb-1">
                      {album.name}
                    </Badge>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Histoires de vie manquées ({permissionData.missingPermissions.lifeStories.length})</h4>
                  {permissionData.missingPermissions.lifeStories.map((story, idx) => (
                    <Badge key={idx} variant="destructive" className="mr-2 mb-1">
                      Histoire #{story.id}
                    </Badge>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Journaux manqués ({permissionData.missingPermissions.diary.length})</h4>
                  {permissionData.missingPermissions.diary.map((diary, idx) => (
                    <Badge key={idx} variant="destructive" className="mr-2 mb-1">
                      {diary.owner_email}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Détails des invitations */}
          <Card>
            <CardHeader>
              <CardTitle>Invitations reçues</CardTitle>
            </CardHeader>
            <CardContent>
              {permissionData.inheritedPermissions.invitations.length === 0 ? (
                <p className="text-gray-500">Aucune invitation trouvée</p>
              ) : (
                <div className="space-y-2">
                  {permissionData.inheritedPermissions.invitations.map((invitation, idx) => (
                    <div key={idx} className="p-3 border rounded bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          Invité par: {invitation.inviter?.display_name || invitation.inviter?.email}
                        </span>
                        <span className="text-sm text-gray-500">
                          {invitation.used_at ? 'Utilisée' : 'En attente'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {invitation.blog_access && <Badge>Blog</Badge>}
                        {invitation.life_story_access && <Badge>Histoire de vie</Badge>}
                        {invitation.diary_access && <Badge>Journal</Badge>}
                        {invitation.wishes_access && <Badge>Souhaits</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {analyzing && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Analyse en cours...</span>
        </div>
      )}
    </div>
  );
};

export default UserPermissionsAnalyzer;
