
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Database, Users } from 'lucide-react';
import SyncPermissionsButton from './SyncPermissionsButton';

const PermissionsSyncControls = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    console.log('🔍 Démarrage du diagnostic global des permissions');

    try {
      // Récupérer toutes les invitations utilisées
      const { data: usedInvitations, error: invitationsError } = await supabase
        .from('invitations')
        .select(`
          *,
          inviter:profiles!invitations_invited_by_fkey(display_name, email)
        `)
        .not('used_at', 'is', null);

      if (invitationsError) throw invitationsError;

      // Récupérer tous les membres de groupes
      const { data: groupMembers, error: groupError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:profiles!group_members_user_id_fkey(display_name, email),
          invitation_groups(name, created_by)
        `);

      if (groupError) throw groupError;

      // Récupérer toutes les permissions actuelles
      const [albumPerms, lifeStoryPerms, diaryPerms] = await Promise.all([
        supabase.from('album_permissions').select('*'),
        supabase.from('life_story_permissions').select('*'),
        supabase.from('diary_permissions').select('*')
      ]);

      const diagnostic = {
        invitations: {
          total: usedInvitations?.length || 0,
          withBlogAccess: usedInvitations?.filter(i => i.blog_access).length || 0,
          withLifeStoryAccess: usedInvitations?.filter(i => i.life_story_access).length || 0,
          withDiaryAccess: usedInvitations?.filter(i => i.diary_access).length || 0,
          details: usedInvitations || []
        },
        groups: {
          total: groupMembers?.length || 0,
          details: groupMembers || []
        },
        currentPermissions: {
          albums: albumPerms.data?.length || 0,
          lifeStories: lifeStoryPerms.data?.length || 0,
          diary: diaryPerms.data?.length || 0
        }
      };

      setDiagnosticData(diagnostic);

      console.log('🔍 Diagnostic terminé:', diagnostic);

      toast({
        title: "Diagnostic terminé",
        description: `${diagnostic.invitations.total} invitations analysées, ${diagnostic.groups.total} membres de groupes trouvés`
      });

    } catch (error) {
      console.error('Erreur lors du diagnostic:', error);
      toast({
        title: "Erreur de diagnostic",
        description: "Impossible d'analyser l'état des permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={runDiagnostic}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Diagnostic...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Diagnostic global
            </>
          )}
        </Button>

        <SyncPermissionsButton />
      </div>

      {diagnosticData && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border rounded bg-blue-50">
            <h4 className="font-medium text-blue-900 mb-2">Invitations utilisées</h4>
            <div className="space-y-1 text-sm">
              <div>Total: {diagnosticData.invitations.total}</div>
              <div>Avec accès blog: {diagnosticData.invitations.withBlogAccess}</div>
              <div>Avec accès histoire: {diagnosticData.invitations.withLifeStoryAccess}</div>
              <div>Avec accès journal: {diagnosticData.invitations.withDiaryAccess}</div>
            </div>
          </div>

          <div className="p-4 border rounded bg-green-50">
            <h4 className="font-medium text-green-900 mb-2">Membres de groupes</h4>
            <div className="space-y-1 text-sm">
              <div>Total: {diagnosticData.groups.total}</div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Utilisateurs dans des groupes
              </div>
            </div>
          </div>

          <div className="p-4 border rounded bg-purple-50">
            <h4 className="font-medium text-purple-900 mb-2">Permissions actuelles</h4>
            <div className="space-y-1 text-sm">
              <div>Albums: {diagnosticData.currentPermissions.albums}</div>
              <div>Histoires: {diagnosticData.currentPermissions.lifeStories}</div>
              <div>Journaux: {diagnosticData.currentPermissions.diary}</div>
            </div>
          </div>
        </div>
      )}

      {diagnosticData && diagnosticData.invitations.details.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Détail des invitations utilisées</h4>
          <div className="space-y-2">
            {diagnosticData.invitations.details.map((invitation: any, idx: number) => (
              <div key={idx} className="p-3 border rounded bg-gray-50 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{invitation.first_name} {invitation.last_name}</span>
                  <span className="text-gray-500">{invitation.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Invité par: {invitation.inviter?.display_name || invitation.inviter?.email}</span>
                  <div className="flex gap-1">
                    {invitation.blog_access && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Blog</span>}
                    {invitation.life_story_access && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Histoire</span>}
                    {invitation.diary_access && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Journal</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsSyncControls;
