
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationProcessRequest {
  email: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, userId }: InvitationProcessRequest = await req.json()

    console.log('🔍 Traitement invitation pour:', { email, userId })

    // 1. Rechercher une invitation valide pour cet email
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitations')
      .select('*')
      .eq('email', email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      console.log('❌ Aucune invitation valide trouvée:', invitationError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucune invitation valide trouvée' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    console.log('✅ Invitation trouvée:', {
      id: invitation.id,
      group_id: invitation.group_id,
      permissions: {
        blog_access: invitation.blog_access,
        life_story_access: invitation.life_story_access,
        diary_access: invitation.diary_access,
        wishes_access: invitation.wishes_access
      }
    })

    // 2. Validation des permissions (règles métier)
    const validatedPermissions = {
      blog_access: Boolean(invitation.blog_access),
      life_story_access: Boolean(invitation.life_story_access),
      diary_access: Boolean(invitation.diary_access),
      wishes_access: Boolean(invitation.wishes_access)
    }

    console.log('🔐 Permissions validées:', validatedPermissions)

    // 3. Traitement en transaction
    const { error: transactionError } = await supabaseClient.rpc('process_invitation_transaction', {
      invitation_id: invitation.id,
      user_id: userId,
      group_id: invitation.group_id,
      validated_permissions: validatedPermissions
    })

    if (transactionError) {
      console.error('❌ Erreur lors du traitement de l\'invitation:', transactionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erreur lors du traitement de l\'invitation' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    console.log('✅ Invitation traitée avec succès')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation traitée avec succès',
        permissions: validatedPermissions
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Erreur générale:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erreur interne du serveur' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
