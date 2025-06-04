
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  contentType: 'blog' | 'diary' | 'wish';
  contentId: string;
  title: string;
  authorId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { contentType, contentId, title, authorId }: NotificationRequest = await req.json();

    // Récupérer les informations de l'auteur
    const { data: authorProfile, error: authorError } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', authorId)
      .single();

    if (authorError || !authorProfile) {
      throw new Error('Author profile not found');
    }

    // Récupérer les membres du groupe de l'auteur (excluant l'auteur lui-même)
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        group_id,
        profiles!group_members_user_id_fkey(email, display_name)
      `)
      .in('group_id', 
        supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', authorId)
      )
      .neq('user_id', authorId);

    if (membersError) {
      throw new Error('Failed to fetch group members');
    }

    if (!groupMembers || groupMembers.length === 0) {
      console.log('No group members found for notifications');
      return new Response(
        JSON.stringify({ message: 'No group members to notify' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Construire l'URL du contenu
    const baseUrl = supabaseUrl.replace('.supabase.co', '.vercel.app');
    const contentUrl = contentType === 'blog' ? `${baseUrl}/blog/${contentId}` :
                      contentType === 'diary' ? `${baseUrl}/diary/${contentId}` :
                      `${baseUrl}/wishes/${contentId}`;

    // Préparer et envoyer les emails
    const emailPromises = groupMembers.map(async (member: any) => {
      const memberProfile = member.profiles;
      if (!memberProfile?.email) return;

      const contentTypeLabel = contentType === 'blog' ? 'article de blog' :
                              contentType === 'diary' ? 'entrée de journal' : 'souhait';

      try {
        await resend.emails.send({
          from: 'Tranches de Vie <onboarding@resend.dev>',
          to: [memberProfile.email],
          subject: `Nouvelle publication de ${authorProfile.display_name || authorProfile.email}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2D5A27;">Nouvelle publication sur Tranches de Vie</h2>
              
              <p>Bonjour ${memberProfile.display_name || memberProfile.email},</p>
              
              <p><strong>${authorProfile.display_name || authorProfile.email}</strong> a publié un nouveau ${contentTypeLabel} :</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0; color: #2D5A27;">${title}</h3>
              </div>
              
              <p>
                <a href="${contentUrl}" 
                   style="background-color: #2D5A27; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Lire maintenant
                </a>
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              
              <p style="font-size: 12px; color: #666;">
                Vous recevez cet email car vous faites partie du groupe de ${authorProfile.display_name || authorProfile.email}.
                <br>
                Tranches de Vie - Partagez vos moments précieux
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${memberProfile.email}:`, emailError);
      }
    });

    await Promise.allSettled(emailPromises);

    return new Response(
      JSON.stringify({ message: 'Group notifications sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-group-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
