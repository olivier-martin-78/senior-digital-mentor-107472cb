
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request) => {
  console.log("=== DÉBUT FONCTION send-password-reset ===");
  console.log(`Méthode de requête: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Requête OPTIONS reçue");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Lecture du corps de la requête...");
    const { email } = await req.json();
    console.log("Corps de la requête reçu:", { email });

    console.log("Validation des paramètres...");
    if (!email || typeof email !== 'string' || email.trim() === '') {
      console.error("Email manquant ou invalide");
      throw new Error("L'email est requis et doit être valide");
    }
    console.log("Paramètres validés avec succès");

    console.log("Vérification des variables d'environnement...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variables d'environnement Supabase manquantes");
      throw new Error("Configuration Supabase manquante");
    }
    console.log("Variables d'environnement trouvées");

    // Create Supabase client with service role key for admin operations
    console.log("Création du client Supabase...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use the correct application domain for redirect URL
    const redirectTo = "https://senior-digital-mentor.com/auth?reset=true";
    console.log(`URL de redirection utilisée: ${redirectTo}`);

    console.log(`Envoi de l'email de réinitialisation pour: ${email.trim()}`);
    
    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo,
    });

    if (error) {
      console.error("Erreur Supabase lors de l'envoi:", error);
      throw new Error(error.message || "Erreur lors de l'envoi de l'email de réinitialisation");
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
