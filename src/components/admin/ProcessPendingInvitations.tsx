
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
    
    try {
      // Récupérer les invitations non utilisées avec des utilisateurs confirmés
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
        .gt('expires_at', new Date().toISOString());

      if (invitationsError) {
        throw invitationsError;
      }

      if (!pendingInvitations || pendingInvitations.length === 0) {
        toast({
          title: "Aucune invitation en attente",
          description: "Toutes les invitations ont déjà été traitées."
        });
        return;
      }

      let processedCount = 0;

      // Traiter chaque invitation
      for (const invitation of pendingInvitations) {
        // Chercher l'utilisateur confirmé avec cet email
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          console.error('Erreur lors de la récupération des utilisateurs:', userError);
          continue;
        }

        // Vérifier que userData et users existent et ont le bon type
        if (!userData || !userData.users || !Array.isArray(userData.users)) {
          console.error('Données utilisateurs invalides');
          continue;
        }

        const user = userData.users.find(u => 
          u.email === invitation.email && 
          u.email_confirmed_at !== null
        );

        if (user && user.id) {
          // Vérifier si l'utilisateur n'est pas déjà dans le groupe
          const { data: existingMember } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', invitation.group_id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingMember) {
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
              await supabase
                .from('invitations')
                .update({ used_at: new Date().toISOString() })
                .eq('id', invitation.id);

              processedCount++;
            } else {
              console.error('Erreur lors de l\'ajout au groupe:', memberError);
            }
          }
        }
      }

      if (processedCount > 0) {
        toast({
          title: "Invitations traitées",
          description: `${processedCount} utilisateur(s) ont été ajoutés à leur groupe d'invitation.`
        });
      } else {
        toast({
          title: "Aucun traitement nécessaire",
          description: "Tous les utilisateurs invités sont déjà dans leurs groupes respectifs."
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
