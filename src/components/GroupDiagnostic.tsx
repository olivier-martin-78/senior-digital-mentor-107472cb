
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GroupMembership {
  group_id: string;
  role: string;
  invitation_groups: {
    name: string;
    created_by: string;
  };
  profiles: {
    email: string;
    display_name: string | null;
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

const GroupDiagnostic: React.FC = () => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState<GroupMembership[]>([]);
  const [authors, setAuthors] = useState<AuthorInfo[]>([]);
  const [loading, setLoading] = useState(false);

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
          invitation_groups!inner(name, created_by),
          profiles!group_members_user_id_fkey(email, display_name)
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

      // Trouver l'utilisateur cible
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

      // Recharger le diagnostic
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Diagnostic des Groupes
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
          <div className="space-y-4">
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
