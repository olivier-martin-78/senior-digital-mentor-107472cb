
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
  console.log("Method:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Webhook payload reçu:", JSON.stringify(payload, null, 2));

    // Vérifier si c'est un événement de création d'utilisateur
    // Supabase envoie "users" comme nom de table, pas "auth.users"
    if (payload.table === "users" && payload.type === "INSERT") {
      const user = payload.record;
      console.log("Nouvel utilisateur créé:", {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        confirmation_sent_at: user.confirmation_sent_at
      });

      // Si l'email est déjà confirmé, pas besoin d'envoyer un email de confirmation
      if (user.email_confirmed_at) {
        console.log("Email déjà confirmé, pas d'envoi d'email de confirmation");
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Email déjà confirmé" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Générer un token de confirmation si pas disponible
      let confirmationToken = user.email_confirm_token;
      
      if (!confirmationToken) {
        // Générer un token temporaire pour l'URL
        confirmationToken = crypto.randomUUID();
        console.log("Token de confirmation généré:", confirmationToken);
      }

      // Générer l'URL de confirmation personnalisée
      const baseUrl = "https://senior-digital-mentor.com";
      const confirmationUrl = `${baseUrl}/auth/confirm?token=${confirmationToken}&type=signup&redirect_to=${encodeURIComponent(baseUrl + '/auth')}`;
      
      console.log("URL de confirmation générée:", confirmationUrl);

      // Appeler notre fonction d'envoi d'email personnalisé
      console.log("Appel de la fonction send-confirmation-email...");
      const { data: emailData, error } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: user.email,
          confirmationUrl: confirmationUrl,
          displayName: user.raw_user_meta_data?.display_name || user.raw_user_meta_data?.full_name || user.email.split('@')[0]
        }
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message 
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log("Email de confirmation personnalisé envoyé avec succès:", emailData);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email de confirmation envoyé",
        emailData: emailData 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else {
      console.log("Événement ignoré:", { table: payload.table, type: payload.type });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Événement ignoré" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Erreur dans auth-webhook:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
