
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';

const ProcessPendingInvitations = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processPendingInvitations = async () => {
    setIsProcessing(true);
    console.log('Début du traitement des invitations en attente');
    
    try {
      // D'abord, récupérons TOUTES les invitations pour voir ce qu'il y a en base
      console.log('=== DEBUG: Récupération de TOUTES les invitations ===');
      const { data: allInvitations, error: allInvitationsError } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          group_id,
          used_at,
          expires_at,
          invitation_groups(name)
        `);

      if (allInvitationsError) {
        console.error('Erreur lors de la récupération de toutes les invitations:', allInvitationsError);
      } else {
        console.log('Toutes les invitations en base:', allInvitations);
        console.log('Nombre total d\'invitations:', allInvitations?.length || 0);
        
        // Analyser chaque invitation
        allInvitations?.forEach((inv, index) => {
          console.log(`Invitation ${index + 1}:`, {
            email: inv.email,
            group_id: inv.group_id,
            used_at: inv.used_at,
            expires_at: inv.expires_at,
            is_expired: new Date(inv.expires_at) <= new Date(),
            has_group: !!inv.group_id,
            is_used: !!inv.used_at
          });
        });
      }

      // Maintenant récupérons les invitations avec nos critères originaux
      console.log('=== DEBUG: Récupération des invitations avec critères ===');
      const currentTime = new Date().toISOString();
      console.log('Date actuelle pour comparaison:', currentTime);
      
      const { data: pendingInvitations, error: invitationsError } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          group_id,
          invitation_groups!inner(name)
        `)
        .is('used_at', null)
        .not('group_id', 'is', null)
        .gt('expires_at', currentTime);

      console.log('Invitations avec critères:', pendingInvitations);

      if (invitationsError) {
        console.error('Erreur lors de la récupération des invitations:', invitationsError);
        throw invitationsError;
      }

      if (!pendingInvitations || pendingInvitations.length === 0) {
        console.log('Aucune invitation en attente trouvée avec les critères');
        toast({
          title: "Aucune invitation en attente",
          description: "Toutes les invitations ont déjà été traitées, ont expiré, ou n'ont pas de groupe associé."
        });
        return;
      }

      console.log(`${pendingInvitations.length} invitations à traiter`);

      // Récupérer tous les utilisateurs confirmés
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('Erreur lors de la récupération des utilisateurs:', userError);
        throw userError;
      }

      console.log('Utilisateurs récupérés:', userData?.users?.length || 0);

      if (!userData?.users || !Array.isArray(userData.users)) {
        console.error('Données utilisateurs invalides');
        throw new Error('Impossible de récupérer les utilisateurs');
      }

      let processedCount = 0;

      // Traiter chaque invitation
      for (const invitation of pendingInvitations) {
        console.log(`Traitement de l'invitation pour: ${invitation.email}`);
        
        // Chercher l'utilisateur confirmé avec cet email
        const user = userData.users.find((u: any) => 
          u.email === invitation.email && 
          u.email_confirmed_at !== null
        );

        if (user?.id) {
          console.log(`Utilisateur trouvé: ${user.id} pour ${invitation.email}`);
          
          // Vérifier si l'utilisateur n'est pas déjà dans le groupe
          const { data: existingMember } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', invitation.group_id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingMember) {
            console.log(`Ajout de l'utilisateur ${user.id} au groupe ${invitation.group_id}`);
            
            // Ajouter l'utilisateur au groupe
            const { error: memberError } = await supabase
              .from('group_members')
              .insert({
                group_id: invitation.group_id,
                user_id: user.id,
                role: 'guest'
              });

            if (!memberError) {
              // Marquer l'invitation comme utilisée
              const { error: updateError } = await supabase
                .from('invitations')
                .update({ used_at: new Date().toISOString() })
                .eq('id', invitation.id);

              if (!updateError) {
                processedCount++;
                console.log(`Invitation traitée avec succès pour ${invitation.email}`);
              } else {
                console.error('Erreur lors de la mise à jour de l\'invitation:', updateError);
              }
            } else {
              console.error('Erreur lors de l\'ajout au groupe:', memberError);
            }
          } else {
            console.log(`L'utilisateur ${user.id} est déjà membre du groupe ${invitation.group_id}`);
          }
        } else {
          console.log(`Aucun utilisateur confirmé trouvé pour l'email: ${invitation.email}`);
        }
      }

      console.log(`Traitement terminé. ${processedCount} utilisateurs traités.`);

      if (processedCount > 0) {
        toast({
          title: "Invitations traitées",
          description: `${processedCount} utilisateur(s) ont été ajoutés à leur groupe d'invitation.`
        });
      } else {
        toast({
          title: "Aucun traitement nécessaire",
          description: "Tous les utilisateurs invités sont déjà dans leurs groupes respectifs ou n'ont pas encore confirmé leur email."
        });
      }

    } catch (error) {
      console.error('Erreur lors du traitement des invitations:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du traitement des invitations.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Traitement rétroactif des invitations
        </CardTitle>
        <CardDescription>
          Traite les utilisateurs qui se sont inscrits avec une invitation mais qui n'ont pas encore été ajoutés à leur groupe d'invitation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={processPendingInvitations}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Traiter les invitations en attente
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProcessPendingInvitations;
