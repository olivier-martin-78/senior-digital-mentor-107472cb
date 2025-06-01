
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-connection-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("=== DÉBUT FONCTION send-password-reset ===");
  console.log(`Méthode de requête: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Requête OPTIONS reçue");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Lecture du corps de la requête...");
    
    let email: string;
    
    try {
      const requestBody = await req.json();
      console.log("Corps de la requête reçu:", requestBody);
      email = requestBody.email;
    } catch (jsonError) {
      console.error("Erreur lors du parsing JSON:", jsonError);
      return new Response(
        JSON.stringify({ 
          error: "Format de requête invalide - JSON attendu",
          details: jsonError instanceof Error ? jsonError.message : "Erreur de parsing"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Validation des paramètres...");
    if (!email || typeof email !== 'string' || email.trim() === '') {
      console.error("Email manquant ou invalide");
      return new Response(
        JSON.stringify({ 
          error: "L'email est requis et doit être valide"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    console.log("Paramètres validés avec succès");

    console.log("Vérification des variables d'environnement...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variables d'environnement Supabase manquantes");
      return new Response(
        JSON.stringify({ 
          error: "Configuration Supabase manquante"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    console.log("Variables d'environnement trouvées");

    // Create Supabase client with service role key for admin operations
    console.log("Création du client Supabase...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the origin from the request headers for dynamic redirect URL
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://a2978196-c5c0-456b-9958-c4dc20b52bea.lovableproject.com';
    const redirectTo = `${origin}/auth?reset=true`;
    console.log(`URL de redirection utilisée: ${redirectTo}`);

    console.log(`Envoi de l'email de réinitialisation pour: ${email.trim()}`);
    
    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo,
    });

    if (error) {
      console.error("Erreur Supabase lors de l'envoi:", error);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de l'envoi de l'email de réinitialisation",
          details: error.message
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("SUCCESS - Email de réinitialisation envoyé avec succès");
    console.log("Données de réponse:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de réinitialisation envoyé avec succès",
        data: data
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("ERREUR dans send-password-reset:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Erreur lors de l'envoi de l'email de réinitialisation",
        details: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
