
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
  console.log("URL:", req.url);
  
  if (req.method === "OPTIONS") {
    console.log("Requête OPTIONS - retour CORS");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Lecture du payload webhook...");
    let payload;
    
    try {
      const body = await req.text();
      console.log("Corps brut reçu:", body);
      payload = JSON.parse(body);
    } catch (parseError) {
      console.error("ERREUR: Impossible de parser le JSON:", parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid JSON payload",
        details: parseError.message 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Webhook payload reçu:", JSON.stringify(payload, null, 2));

    // Gérer les différents formats de webhook possibles
    let userData;
    if (payload.table === "users" && payload.type === "INSERT") {
      // Format webhook table
      userData = payload.record;
      console.log("Format webhook table détecté");
    } else if (payload.type === "signup" || payload.event === "user.created") {
      // Format webhook auth
      userData = payload.user || payload.data;
      console.log("Format webhook auth détecté");
    } else {
      console.log("Type d'événement non géré:", { table: payload.table, type: payload.type, event: payload.event });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Événement ignoré",
        eventType: payload.type || payload.event 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!userData) {
      console.error("ERREUR: Aucune donnée utilisateur trouvée dans le payload");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No user data found in payload" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Données utilisateur extraites:", {
      id: userData.id,
      email: userData.email,
      email_confirmed_at: userData.email_confirmed_at,
      confirmation_sent_at: userData.confirmation_sent_at,
      raw_user_meta_data: userData.raw_user_meta_data
    });

    // Si l'email est déjà confirmé, pas besoin d'envoyer un email de confirmation
    if (userData.email_confirmed_at) {
      console.log("Email déjà confirmé, pas d'envoi d'email de confirmation");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email déjà confirmé" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Génération d'un lien de confirmation via Admin API...");
    
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: userData.email,
    });

    if (linkError) {
      console.error("Erreur lors de la génération du lien:", linkError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to generate confirmation link",
        details: linkError.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Lien de confirmation généré:", linkData.properties.action_link);

    // Extraire le token du lien généré par Supabase
    const originalUrl = new URL(linkData.properties.action_link);
    const token = originalUrl.searchParams.get('token');
    const tokenHash = originalUrl.searchParams.get('token_hash');
    const type = originalUrl.searchParams.get('type');

    // Construire notre propre URL de confirmation avec les paramètres préservés
    const confirmationUrl = new URL('https://senior-digital-mentor.com/auth/confirm');
    if (token) confirmationUrl.searchParams.set('token', token);
    if (tokenHash) confirmationUrl.searchParams.set('token_hash', tokenHash);
    if (type) confirmationUrl.searchParams.set('type', type);

    console.log("URL de confirmation personnalisée:", confirmationUrl.toString());

    // Préparer les paramètres pour l'email
    const emailParams = {
      email: userData.email,
      confirmationUrl: confirmationUrl.toString(),
      displayName: userData.raw_user_meta_data?.display_name || userData.raw_user_meta_data?.full_name || userData.email.split('@')[0]
    };

    console.log("Appel de la fonction send-confirmation-email...");
    console.log("Paramètres envoyés:", JSON.stringify(emailParams, null, 2));

    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
      body: emailParams
    });

    if (emailError) {
      console.error("Erreur lors de l'invocation de send-confirmation-email:", emailError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to send confirmation email",
        details: emailError.message 
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

  } catch (error: any) {
    console.error("ERREUR GLOBALE dans auth-webhook:", error);
    console.error("Stack trace:", error.stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error",
        message: error.message,
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
