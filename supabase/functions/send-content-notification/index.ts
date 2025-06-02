
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

    const { contentType, contentId, title }: NotificationRequest = await req.json();

    // Récupérer les informations de l'auteur
    const { data: authorProfile, error: authorError } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single();

    if (authorError || !authorProfile) {
      throw new Error('Author profile not found');
    }

    // Récupérer les abonnés qui veulent être notifiés pour ce type de contenu
    const notificationField = `${contentType}_notifications`;
    const { data: subscriptions, error: subsError } = await supabase
      .from('notification_subscriptions')
      .select(`
        subscriber_id,
        profiles!notification_subscriptions_subscriber_id_fkey(email, display_name)
      `)
      .eq('author_id', user.id)
      .eq(notificationField, true);

    if (subsError) {
      throw new Error('Failed to fetch subscriptions');
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscribers found for notifications');
      return new Response(
        JSON.stringify({ message: 'No subscribers to notify' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Préparer et envoyer les emails
    const emailPromises = subscriptions.map(async (subscription: any) => {
      const subscriberProfile = subscription.profiles;
      if (!subscriberProfile?.email) return;

      const contentTypeLabel = contentType === 'blog' ? 'article de blog' :
                              contentType === 'diary' ? 'entrée de journal' : 'souhait';

      try {
        await resend.emails.send({
          from: 'Tranches de Vie <onboarding@resend.dev>',
          to: [subscriberProfile.email],
          subject: `Nouvelle publication de ${authorProfile.display_name || authorProfile.email}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2D5A27;">Nouvelle publication sur Tranches de Vie</h2>
              
              <p>Bonjour ${subscriberProfile.display_name || subscriberProfile.email},</p>
              
              <p><strong>${authorProfile.display_name || authorProfile.email}</strong> a publié un nouveau ${contentTypeLabel} :</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0; color: #2D5A27;">${title}</h3>
              </div>
              
              <p>
                <a href="${supabaseUrl.replace('supabase.co', 'vercel.app')}/${contentType === 'blog' ? 'blog' : contentType === 'diary' ? 'diary' : 'wishes'}/${contentType === 'diary' ? contentId : contentType === 'blog' ? contentId : contentId}" 
                   style="background-color: #2D5A27; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Lire maintenant
                </a>
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              
              <p style="font-size: 12px; color: #666;">
                Vous recevez cet email car vous suivez les publications de ${authorProfile.display_name || authorProfile.email}.
                <br>
                Pour modifier vos préférences de notification, connectez-vous à votre compte.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${subscriberProfile.email}:`, emailError);
      }
    });

    await Promise.allSettled(emailPromises);

    return new Response(
      JSON.stringify({ message: 'Notifications sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-content-notification:', error);
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
