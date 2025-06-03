import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, AlertCircle, CheckCircle, RefreshCw, Info, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GroupMembership {
  group_id: string;
  role: string;
  invitation_groups: {
    name: string;
    created_by: string;
  };
}

interface AuthorInfo {
  id: string;
  email: string;
  display_name: string | null;
  groups: Array<{
    group_id: string;
    group_name: string;
    created_by: string;
  }>;
}

interface ContentAccess {
  blog_posts: number;
  diary_entries: number;
  life_stories: number;
  wish_posts: number;
}

interface SpecificUserCheck {
  email: string;
  id: string;
  display_name: string | null;
  groups: Array<{
    group_id: string;
    group_name: string;
    created_by: string;
    is_creator: boolean;
  }>;
  sharedGroups: string[];
}

const GroupDiagnostic: React.FC = () => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState<GroupMembership[]>([]);
  const [authors, setAuthors] = useState<AuthorInfo[]>([]);
  const [contentAccess, setContentAccess] = useState<ContentAccess>({
    blog_posts: 0,
    diary_entries: 0,
    life_stories: 0,
    wish_posts: 0
  });
  const [conceptionCheck, setConceptionCheck] = useState<SpecificUserCheck | null>(null);
  const [olivier78Check, setOlivier78Check] = useState<SpecificUserCheck | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSpecificUsersCheck = async () => {
    if (!user) return;

    try {
      console.log('🔍 DIAGNOSTIC SPÉCIFIQUE - Vérification Conception et Olivier78');

      // Récupérer les infos de Conception
      const { data: conceptionProfile } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .ilike('email', '%conception%')
        .single();

      // Récupérer les infos d'Olivier78
      const { data: olivier78Profile } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .ilike('email', '%olivier78%')
        .single();

      if (conceptionProfile) {
        // Analyser les groupes de Conception
        const { data: conceptionGroups } = await supabase
          .from('group_members')
          .select(`
            group_id,
            role,
            invitation_groups!inner(name, created_by)
          `)
          .eq('user_id', conceptionProfile.id);

        const conceptionGroupsInfo = (conceptionGroups || []).map(g => ({
          group_id: g.group_id,
          group_name: g.invitation_groups?.name || 'Groupe sans nom',
          created_by: g.invitation_groups?.created_by || '',
          is_creator: g.invitation_groups?.created_by === conceptionProfile.id
        }));

        setConceptionCheck({
          ...conceptionProfile,
          groups: conceptionGroupsInfo,
          sharedGroups: []
        });

        console.log('👤 Conception - Groupes trouvés:', conceptionGroupsInfo.length);
        conceptionGroupsInfo.forEach(g => {
          console.log(`  - ${g.group_name} (${g.group_id}) - Créateur: ${g.is_creator ? 'OUI' : 'NON'}`);
        });
      }

      if (olivier78Profile) {
        // Analyser les groupes d'Olivier78
        const { data: olivier78Groups } = await supabase
          .from('group_members')
          .select(`
            group_id,
            role,
            invitation_groups!inner(name, created_by)
          `)
          .eq('user_id', olivier78Profile.id);

        const olivier78GroupsInfo = (olivier78Groups || []).map(g => ({
          group_id: g.group_id,
          group_name: g.invitation_groups?.name || 'Groupe sans nom',
          created_by: g.invitation_groups?.created_by || '',
          is_creator: g.invitation_groups?.created_by === olivier78Profile.id
        }));

        // Trouver les groupes partagés entre Conception et Olivier78
        const sharedGroups = olivier78GroupsInfo
          .filter(og => conceptionCheck?.groups.some(cg => cg.group_id === og.group_id))
          .map(g => g.group_id);

        setOlivier78Check({
          ...olivier78Profile,
          groups: olivier78GroupsInfo,
          sharedGroups
        });

        console.log('👤 Olivier78 - Groupes trouvés:', olivier78GroupsInfo.length);
        olivier78GroupsInfo.forEach(g => {
          console.log(`  - ${g.group_name} (${g.group_id}) - Créateur: ${g.is_creator ? 'OUI' : 'NON'}`);
        });
        console.log('🤝 Groupes partagés avec Conception:', sharedGroups.length);
      }

    } catch (error: any) {
      console.error('❌ DIAGNOSTIC SPÉCIFIQUE - Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le diagnostic spécifique",
        variant: "destructive"
      });
    }
  };

  const loadDiagnostic = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 DIAGNOSTIC - Début analyse pour:', user.email);

      // Charger mes groupes
      const { data: myGroupsData, error: myGroupsError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          invitation_groups!inner(name, created_by)
        `)
        .eq('user_id', user.id);

      if (myGroupsError) throw myGroupsError;
      setMyGroups(myGroupsData || []);

      // Charger tous les auteurs et leurs groupes
      const { data: allAuthors, error: authorsError } = await supabase
        .from('profiles')
        .select('id, email, display_name');

      if (authorsError) throw authorsError;

      const authorsWithGroups: AuthorInfo[] = [];

      for (const author of allAuthors || []) {
        const { data: authorGroups } = await supabase
          .from('group_members')
          .select(`
            group_id,
            invitation_groups!inner(name, created_by)
          `)
          .eq('user_id', author.id);

        authorsWithGroups.push({
          ...author,
          groups: (authorGroups || []).map(ag => ({
            group_id: ag.group_id,
            group_name: ag.invitation_groups?.name || 'Groupe sans nom',
            created_by: ag.invitation_groups?.created_by || ''
          }))
        });
      }

      setAuthors(authorsWithGroups);

      // Tester l'accès aux contenus
      const contentTests = await Promise.all([
        supabase.from('blog_posts').select('id'),
        supabase.from('diary_entries').select('id'),
        supabase.from('life_stories').select('id'),
        supabase.from('wish_posts').select('id')
      ]);

      setContentAccess({
        blog_posts: contentTests[0].data?.length || 0,
        diary_entries: contentTests[1].data?.length || 0,
        life_stories: contentTests[2].data?.length || 0,
        wish_posts: contentTests[3].data?.length || 0
      });

      // Charger la vérification spécifique
      await loadSpecificUsersCheck();

      console.log('✅ DIAGNOSTIC - Analyse terminée');
    } catch (error: any) {
      console.error('❌ DIAGNOSTIC - Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le diagnostic",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fixGroupMembership = async (targetUserEmail: string) => {
    if (!user) return;

    try {
      console.log('🔧 DIAGNOSTIC - Correction appartenance groupe pour:', targetUserEmail);

      const targetAuthor = authors.find(a => a.email === targetUserEmail);
      if (!targetAuthor) {
        toast({
          title: "Erreur",
          description: "Utilisateur cible non trouvé",
          variant: "destructive"
        });
        return;
      }

      // Trouver le groupe créé par l'utilisateur cible
      const { data: targetUserGroups, error: groupError } = await supabase
        .from('invitation_groups')
        .select('id')
        .eq('created_by', targetAuthor.id);

      if (groupError || !targetUserGroups?.length) {
        toast({
          title: "Erreur",
          description: "Aucun groupe trouvé pour cet utilisateur",
          variant: "destructive"
        });
        return;
      }

      const targetGroupId = targetUserGroups[0].id;

      // Vérifier si je suis déjà membre
      const { data: existingMembership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', targetGroupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMembership) {
        toast({
          title: "Info",
          description: "Vous êtes déjà membre de ce groupe",
        });
        return;
      }

      // Ajouter au groupe
      const { error: insertError } = await supabase
        .from('group_members')
        .insert({
          group_id: targetGroupId,
          user_id: user.id,
          role: 'guest'
        });

      if (insertError) throw insertError;

      toast({
        title: "Succès",
        description: `Ajouté au groupe de ${targetUserEmail}`,
      });

      loadDiagnostic();

    } catch (error: any) {
      console.error('❌ DIAGNOSTIC - Erreur correction:', error);
      toast({
        title: "Erreur",
        description: "Impossible de corriger l'appartenance au groupe",
        variant: "destructive"
      });
    }
  };

  const createCrossGroupAccess = async () => {
    if (!user) return;

    try {
      console.log('🔧 DIAGNOSTIC - Création accès croisé entre tous les utilisateurs');

      // Récupérer tous les utilisateurs
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email');

      if (usersError || !allUsers) throw usersError;

      // Pour chaque utilisateur, s'assurer qu'il a accès aux groupes des autres
      for (const otherUser of allUsers) {
        if (otherUser.id === user.id) continue;

        // Trouver le groupe créé par cet utilisateur
        const { data: userGroups } = await supabase
          .from('invitation_groups')
          .select('id')
          .eq('created_by', otherUser.id);

        if (userGroups && userGroups.length > 0) {
          const groupId = userGroups[0].id;

          // Vérifier si je suis déjà membre
          const { data: existingMembership } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingMembership) {
            // M'ajouter au groupe
            await supabase
              .from('group_members')
              .insert({
                group_id: groupId,
                user_id: user.id,
                role: 'guest'
              });
          }
        }
      }

      toast({
        title: "Succès",
        description: "Accès croisé créé entre tous les utilisateurs",
      });

      loadDiagnostic();

    } catch (error: any) {
      console.error('❌ DIAGNOSTIC - Erreur création accès croisé:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'accès croisé",
        variant: "destructive"
      });
    }
  };

  const hasAccessTo = (authorId: string): boolean => {
    if (authorId === user?.id) return true;

    const myGroupIds = myGroups.map(g => g.group_id);
    const authorGroupIds = authors.find(a => a.id === authorId)?.groups.map(g => g.group_id) || [];

    return myGroupIds.some(gId => authorGroupIds.includes(gId));
  };

  useEffect(() => {
    loadDiagnostic();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Vérification spécifique Conception & Olivier78 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Vérification spécifique : Conception & Olivier78
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Conception */}
            <div className="space-y-3">
              <h4 className="font-medium text-lg">👤 Conception</h4>
              {conceptionCheck ? (
                <div className="space-y-2">
                  <p className="text-sm"><strong>Email:</strong> {conceptionCheck.email}</p>
                  <p className="text-sm"><strong>Nom affiché:</strong> {conceptionCheck.display_name || 'Non défini'}</p>
                  <div>
                    <p className="text-sm font-medium">Groupes ({conceptionCheck.groups.length}):</p>
                    {conceptionCheck.groups.length === 0 ? (
                      <p className="text-sm text-red-500">⚠️ Aucun groupe trouvé</p>
                    ) : (
                      <div className="space-y-1">
                        {conceptionCheck.groups.map((group, index) => (
                          <div key={index} className="text-xs p-2 border rounded">
                            <p><strong>{group.group_name}</strong></p>
                            <p>ID: {group.group_id}</p>
                            <p className={group.is_creator ? "text-green-600" : "text-blue-600"}>
                              {group.is_creator ? "🔑 Créateur du groupe" : "👥 Membre invité"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Utilisateur non trouvé</p>
              )}
            </div>

            {/* Olivier78 */}
            <div className="space-y-3">
              <h4 className="font-medium text-lg">👤 Olivier78</h4>
              {olivier78Check ? (
                <div className="space-y-2">
                  <p className="text-sm"><strong>Email:</strong> {olivier78Check.email}</p>
                  <p className="text-sm"><strong>Nom affiché:</strong> {olivier78Check.display_name || 'Non défini'}</p>
                  <div>
                    <p className="text-sm font-medium">Groupes ({olivier78Check.groups.length}):</p>
                    {olivier78Check.groups.length === 0 ? (
                      <p className="text-sm text-red-500">⚠️ Aucun groupe trouvé</p>
                    ) : (
                      <div className="space-y-1">
                        {olivier78Check.groups.map((group, index) => (
                          <div key={index} className="text-xs p-2 border rounded">
                            <p><strong>{group.group_name}</strong></p>
                            <p>ID: {group.group_id}</p>
                            <p className={group.is_creator ? "text-green-600" : "text-blue-600"}>
                              {group.is_creator ? "🔑 Créateur du groupe" : "👥 Membre invité"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Groupes partagés */}
                  <div className="mt-3 p-3 bg-blue-50 rounded">
                    <p className="text-sm font-medium">🤝 Groupes partagés avec Conception:</p>
                    {olivier78Check.sharedGroups.length === 0 ? (
                      <p className="text-sm text-red-600">❌ Aucun groupe partagé trouvé!</p>
                    ) : (
                      <p className="text-sm text-green-600">✅ {olivier78Check.sharedGroups.length} groupe(s) partagé(s)</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Utilisateur non trouvé</p>
              )}
            </div>
          </div>

          {/* Diagnostic */}
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h5 className="font-medium mb-2">🔍 Diagnostic</h5>
            {conceptionCheck && olivier78Check ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  {conceptionCheck.groups.some(g => g.is_creator) ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm">
                    Conception {conceptionCheck.groups.some(g => g.is_creator) ? 'EST' : 'N\'EST PAS'} créateur/membre de son propre groupe
                  </span>
                </div>
                <div className="flex items-center">
                  {olivier78Check.sharedGroups.length > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm">
                    Olivier78 {olivier78Check.sharedGroups.length > 0 ? 'PARTAGE' : 'NE PARTAGE PAS'} de groupe avec Conception
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Données insuffisantes pour le diagnostic</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Diagnostic des Groupes et Accès aux Contenus
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDiagnostic}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Accès aux contenus */}
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Contenus accessibles
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border rounded">
                  <div className="text-sm text-gray-500">Blog Posts</div>
                  <div className="text-2xl font-bold">{contentAccess.blog_posts}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-gray-500">Diary Entries</div>
                  <div className="text-2xl font-bold">{contentAccess.diary_entries}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-gray-500">Life Stories</div>
                  <div className="text-2xl font-bold">{contentAccess.life_stories}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-gray-500">Wish Posts</div>
                  <div className="text-2xl font-bold">{contentAccess.wish_posts}</div>
                </div>
              </div>
            </div>

            {/* Mes groupes */}
            <div>
              <h3 className="font-medium mb-2">Mes groupes ({myGroups.length})</h3>
              {myGroups.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun groupe</p>
              ) : (
                <div className="space-y-2">
                  {myGroups.map((group, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{group.invitation_groups.name}</span>
                        <p className="text-sm text-gray-500">Rôle: {group.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions de correction */}
            <div>
              <h3 className="font-medium mb-2">Actions de correction</h3>
              <div className="space-y-2">
                <Button
                  onClick={createCrossGroupAccess}
                  disabled={loading}
                  className="w-full"
                >
                  Créer un accès croisé entre tous les utilisateurs
                </Button>
                <p className="text-sm text-gray-500">
                  Cette action va s'assurer que tous les utilisateurs peuvent voir les contenus des autres
                </p>
              </div>
            </div>

            {/* Accès aux auteurs */}
            <div>
              <h3 className="font-medium mb-2">Accès aux auteurs</h3>
              <div className="space-y-2">
                {authors.map((author) => {
                  const hasAccess = hasAccessTo(author.id);
                  const isMe = author.id === user.id;
                  
                  return (
                    <div key={author.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center">
                        {hasAccess ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <div>
                          <span className="font-medium">
                            {author.display_name || author.email}
                            {isMe && ' (Moi)'}
                          </span>
                          <p className="text-sm text-gray-500">
                            {author.groups.length} groupe(s)
                          </p>
                        </div>
                      </div>
                      {!hasAccess && !isMe && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fixGroupMembership(author.email)}
                          disabled={loading}
                        >
                          Corriger accès
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupDiagnostic;
