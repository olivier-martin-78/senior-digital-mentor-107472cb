
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-connection-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("=== DÉBUT FONCTION send-password-reset ===");
  console.log(`Méthode de requête: ${req.method}`);
  console.log(`Headers:`, Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Requête OPTIONS reçue");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Lecture du corps de la requête...");
    
    let email: string;
    let requestBody: any;
    
    // Diagnostic approfondi du parsing JSON
    try {
      const contentType = req.headers.get('content-type') || '';
      console.log(`Content-Type: ${contentType}`);
      
      if (!contentType.includes('application/json')) {
        console.warn(`Content-Type inattendu: ${contentType}`);
      }
      
      // Vérification si le body est lisible
      const hasBody = req.body !== null;
      console.log(`Corps de requête présent: ${hasBody}`);
      
      if (!hasBody) {
        throw new Error("Aucun corps de requête détecté");
      }
      
      requestBody = await req.json();
      console.log("Corps de la requête parsé avec succès:", requestBody);
      email = requestBody.email;
    } catch (jsonError) {
      console.error("Erreur lors du parsing JSON:", {
        error: jsonError,
        message: jsonError instanceof Error ? jsonError.message : 'Erreur inconnue',
        name: jsonError instanceof Error ? jsonError.name : 'Inconnu'
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Format de requête invalide - JSON attendu",
          details: jsonError instanceof Error ? jsonError.message : "Erreur de parsing",
          debug: {
            contentType: req.headers.get('content-type'),
            hasBody: req.body !== null,
            method: req.method
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Validation des paramètres...");
    if (!email || typeof email !== 'string' || email.trim() === '') {
      console.error("Email manquant ou invalide:", { email, type: typeof email });
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
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
    
    console.log("Variables d'environnement Supabase trouvées");
    console.log(`Resend API Key disponible: ${!!resendApiKey}`);

    // Create Supabase client with service role key
    console.log("Création du client Supabase...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate reset token and get user info
    console.log(`Génération du token de réinitialisation pour: ${email.trim()}`);
    
    // First, check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email.trim());
    
    if (userError || !userData.user) {
      console.error("Utilisateur non trouvé:", userError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Si cet email existe, un lien de réinitialisation a été envoyé"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Utilisateur trouvé, génération du token...");

    // Generate reset token
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim(),
    });

    if (tokenError || !tokenData) {
      console.error("Erreur lors de la génération du token:", tokenError);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de la génération du token de réinitialisation"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Token généré avec succès");

    // Get the origin for the reset URL
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://a2978196-c5c0-456b-9958-c4dc20b52bea.lovableproject.com';
    
    // Extract token from the generated link
    const linkUrl = new URL(tokenData.properties.action_link);
    const token = linkUrl.searchParams.get('token');
    const type = linkUrl.searchParams.get('type');
    
    const resetUrl = `${origin}/reset-password?token=${token}&type=${type}`;
    console.log(`URL de réinitialisation: ${resetUrl}`);

    // Send email using Resend if available, otherwise fallback to Supabase
    if (resendApiKey) {
      console.log("Envoi de l'email via Resend...");
      
      try {
        const resend = new Resend(resendApiKey);
        
        const emailResponse = await resend.emails.send({
          from: 'noreply@resend.dev', // Change this to your verified domain
          to: [email.trim()],
          subject: 'Réinitialisation de votre mot de passe',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
              <p>Bonjour,</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
              <p style="margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Réinitialiser mon mot de passe
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
              </p>
              <p style="color: #666; font-size: 14px;">
                Ce lien est valide pendant 60 minutes.
              </p>
            </div>
          `,
        });

        if (emailResponse.error) {
          throw new Error(`Erreur Resend: ${emailResponse.error.message}`);
        }

        console.log("Email envoyé avec succès via Resend:", emailResponse);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email de réinitialisation envoyé avec succès",
            method: "resend"
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
        
      } catch (resendError) {
        console.error("Erreur Resend, fallback vers Supabase:", resendError);
        // Continue to Supabase fallback below
      }
    }

    // Fallback to Supabase auth email
    console.log("Envoi de l'email via Supabase Auth...");
    
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: resetUrl,
    });

    if (authError) {
      console.error("Erreur Supabase lors de l'envoi:", authError);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de l'envoi de l'email de réinitialisation",
          details: authError.message
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("SUCCESS - Email de réinitialisation envoyé via Supabase");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de réinitialisation envoyé avec succès",
        method: "supabase"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("ERREUR dans send-password-reset:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
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
