
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, User, UserPlus, UserCheck } from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
}

interface InviterPermissions {
  inviter: {
    id: string;
    display_name: string | null;
    email: string;
  };
  albums: any[];
  lifeStories: any[];
  diary: boolean;
  invitation: any;
}

interface UserPermissionData {
  inviterPermissions: InviterPermissions[];
  currentPermissions: {
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
      const userProfile = users.find(u => u.id === userId);
      if (!userProfile) return;

      // Récupérer les permissions actuelles de l'utilisateur
      const [albumPermissions, lifeStoryPermissions, diaryPermissions] = await Promise.all([
        supabase.from('album_permissions').select(`
          *,
          blog_albums(id, name, author_id)
        `).eq('user_id', userId),
        
        supabase.from('life_story_permissions').select('*').eq('permitted_user_id', userId),
        
        supabase.from('diary_permissions').select('*').eq('permitted_user_id', userId)
      ]);

      // Récupérer les invitations pour cet utilisateur
      const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', userProfile.email)
        .not('used_at', 'is', null);

      // Pour chaque invitation, récupérer les permissions de l'inviteur
      const inviterPermissions: InviterPermissions[] = [];
      
      if (invitations) {
        for (const invitation of invitations) {
          // Récupérer les informations de l'inviteur
          const { data: inviterData } = await supabase
            .from('profiles')
            .select('id, display_name, email')
            .eq('id', invitation.invited_by)
            .single();

          if (!inviterData) continue;

          // Récupérer les contenus de l'inviteur selon les permissions accordées
          const inviterContent: InviterPermissions = {
            inviter: inviterData,
            albums: [],
            lifeStories: [],
            diary: false,
            invitation
          };

          // Albums si blog_access = true
          if (invitation.blog_access) {
            const { data: inviterAlbums } = await supabase
              .from('blog_albums')
              .select('*')
              .eq('author_id', invitation.invited_by);
            inviterContent.albums = inviterAlbums || [];
          }

          // Histoires de vie si life_story_access = true
          if (invitation.life_story_access) {
            const { data: inviterLifeStories } = await supabase
              .from('life_stories')
              .select('*')
              .eq('user_id', invitation.invited_by);
            inviterContent.lifeStories = inviterLifeStories || [];
          }

          // Journal si diary_access = true
          if (invitation.diary_access) {
            inviterContent.diary = true;
          }

          inviterPermissions.push(inviterContent);
        }
      }

      setPermissionData({
        inviterPermissions,
        currentPermissions: {
          albums: albumPermissions.data || [],
          lifeStories: lifeStoryPermissions.data || [],
          diary: diaryPermissions.data || []
        }
      });

      console.log('🔍 Analyse terminée:', {
        inviterPermissions: inviterPermissions.length,
        currentPermissions: {
          albums: albumPermissions.data?.length || 0,
          lifeStories: lifeStoryPermissions.data?.length || 0,
          diary: diaryPermissions.data?.length || 0
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

  const syncUserPermissions = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-invitation-permissions', {
        body: { targetUserId: selectedUserId }
      });

      if (error) throw error;

      toast({
        title: "Synchronisation réussie",
        description: data.message || "Permissions synchronisées avec succès"
      });

      // Recharger l'analyse
      await analyzeUserPermissions(selectedUserId);

    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les permissions",
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
          <div className="flex gap-2">
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

            <Button
              onClick={syncUserPermissions}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sync...
                </>
              ) : (
                'Synchroniser les permissions'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Résultats de l'analyse */}
      {selectedUser && permissionData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Analyse pour {selectedUser.display_name || selectedUser.email}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Carte 1: Permissions des inviteurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Permissions des inviteurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {permissionData.inviterPermissions.length === 0 ? (
                  <p className="text-gray-500">Aucune invitation trouvée</p>
                ) : (
                  permissionData.inviterPermissions.map((inviterPerm, idx) => (
                    <div key={idx} className="p-3 border rounded bg-gray-50">
                      <div className="font-medium mb-2">
                        {inviterPerm.inviter.display_name || inviterPerm.inviter.email}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Albums ({inviterPerm.albums.length}):</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {inviterPerm.albums.map((album, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {album.name}
                              </Badge>
                            ))}
                            {inviterPerm.albums.length === 0 && <span className="text-gray-400">Aucun</span>}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Histoires de vie ({inviterPerm.lifeStories.length}):</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {inviterPerm.lifeStories.map((story, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {story.title}
                              </Badge>
                            ))}
                            {inviterPerm.lifeStories.length === 0 && <span className="text-gray-400">Aucune</span>}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Journal:</span>
                          <span className={`ml-2 ${inviterPerm.diary ? 'text-green-600' : 'text-gray-400'}`}>
                            {inviterPerm.diary ? 'Accès accordé' : 'Pas d\'accès'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Carte 2: Permissions actuelles de l'invité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Permissions de l'invité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Albums ({permissionData.currentPermissions.albums.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {permissionData.currentPermissions.albums.map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {perm.blog_albums?.name || 'Album inconnu'}
                      </Badge>
                    ))}
                    {permissionData.currentPermissions.albums.length === 0 && (
                      <span className="text-gray-400">Aucune permission d'album</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Histoires de vie ({permissionData.currentPermissions.lifeStories.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {permissionData.currentPermissions.lifeStories.map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        Propriétaire: {perm.story_owner_id}
                      </Badge>
                    ))}
                    {permissionData.currentPermissions.lifeStories.length === 0 && (
                      <span className="text-gray-400">Aucune permission d'histoire</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Journaux ({permissionData.currentPermissions.diary.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {permissionData.currentPermissions.diary.map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        Propriétaire: {perm.diary_owner_id}
                      </Badge>
                    ))}
                    {permissionData.currentPermissions.diary.length === 0 && (
                      <span className="text-gray-400">Aucune permission de journal</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
