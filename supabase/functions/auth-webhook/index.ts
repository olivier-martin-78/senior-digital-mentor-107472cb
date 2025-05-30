
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("=== DEBUT auth-webhook ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Webhook payload reçu:", payload);

    // Vérifier si c'est un événement de création d'utilisateur
    if (payload.table === "auth.users" && payload.type === "INSERT") {
      const user = payload.record;
      console.log("Nouvel utilisateur créé:", user.email);

      // Générer l'URL de confirmation personnalisée
      const confirmationUrl = `https://senior-digital-mentor.com/auth?token=${user.email_confirm_token}&type=signup&redirect_to=https://senior-digital-mentor.com/auth`;

      // Appeler notre fonction d'envoi d'email personnalisé
      const { error } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: user.email,
          confirmationUrl: confirmationUrl,
          displayName: user.raw_user_meta_data?.display_name
        }
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
        throw error;
      }

      console.log("Email de confirmation personnalisé envoyé avec succès");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Erreur dans auth-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
