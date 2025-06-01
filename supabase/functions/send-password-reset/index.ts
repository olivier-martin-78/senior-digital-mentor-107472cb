
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
  console.log(`URL complète: ${req.url}`);
  console.log(`Headers reçus:`, Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Requête OPTIONS reçue - retour CORS");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== LECTURE DU CORPS DE REQUÊTE ===");
    
    // Vérifier si le corps existe
    const contentLength = req.headers.get('content-length');
    console.log(`Content-Length: ${contentLength}`);
    
    if (!contentLength || contentLength === '0') {
      console.error("❌ Corps de requête vide détecté");
      return new Response(
        JSON.stringify({ error: "Corps de requête vide - veuillez fournir un email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Lire le corps avec gestion d'erreur robuste
    let requestBody;
    let rawBody;
    
    try {
      rawBody = await req.text();
      console.log(`Corps brut reçu (${rawBody.length} caractères):`, rawBody);
      
      if (!rawBody || rawBody.trim() === '') {
        throw new Error("Corps de requête vide après lecture");
      }
      
      requestBody = JSON.parse(rawBody);
      console.log("Corps de requête parsé avec succès:", requestBody);
      
    } catch (parseError) {
      console.error("❌ Erreur de parsing du JSON:", parseError);
      console.log("Corps brut qui a causé l'erreur:", rawBody);
      
      return new Response(
        JSON.stringify({ 
          error: "Format JSON invalide", 
          details: parseError.message,
          receivedBody: rawBody 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const email = requestBody?.email;
    
    // Validation de l'email
    if (!email || typeof email !== 'string' || email.trim() === '') {
      console.error("❌ Email manquant ou invalide:", { 
        email, 
        type: typeof email, 
        requestBody 
      });
      return new Response(
        JSON.stringify({ error: "L'email est requis et doit être valide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`✅ Email validé: ${email.trim()}`);

    // Vérification des variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    console.log("Variables d'environnement:", {
      supabaseUrl: supabaseUrl ? "✅ Présente" : "❌ Manquante",
      supabaseServiceKey: supabaseServiceKey ? "✅ Présente" : "❌ Manquante",
      resendApiKey: resendApiKey ? "✅ Présente" : "❌ Manquante"
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variables d'environnement Supabase manquantes");
      return new Response(
        JSON.stringify({ error: "Configuration Supabase manquante" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!resendApiKey) {
      console.error("❌ Clé API Resend manquante");
      return new Response(
        JSON.stringify({ error: "Configuration Resend manquante" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("✅ Variables d'environnement vérifiées avec succès");

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log("✅ Client Supabase créé avec la clé de service");

    // Générer directement le token de réinitialisation sans vérifier l'utilisateur
    console.log(`🔗 Génération du token de réinitialisation pour: ${email.trim()}`);
    
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim(),
    });

    if (tokenError || !tokenData) {
      console.error("❌ Erreur lors de la génération du token:", tokenError);
      
      // Pour la sécurité, ne pas révéler si l'utilisateur existe ou non
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Si cet email existe, un lien de réinitialisation a été envoyé"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("✅ Token généré avec succès");

    // Récupérer l'origine pour l'URL de réinitialisation
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://a2978196-c5c0-456b-9958-c4dc20b52bea.lovableproject.com';
    
    // Extraire le token du lien généré
    const linkUrl = new URL(tokenData.properties.action_link);
    const token = linkUrl.searchParams.get('token');
    const type = linkUrl.searchParams.get('type');
    
    // Créer l'URL de réinitialisation vers notre page dédiée
    const resetUrl = `${origin}/reset-password?token=${token}&type=${type}`;
    console.log(`🔗 URL de réinitialisation: ${resetUrl}`);

    // Envoyer l'email via Resend
    console.log("📧 Envoi de l'email via Resend...");
    
    const resend = new Resend(resendApiKey);
    
    const emailResponse = await resend.emails.send({
      from: 'noreply@resend.dev',
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
      console.error("❌ Erreur Resend:", emailResponse.error);
      throw new Error(`Erreur Resend: ${emailResponse.error.message}`);
    }

    console.log("✅ Email envoyé avec succès via Resend:", emailResponse);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de réinitialisation envoyé avec succès"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("💥 ERREUR dans send-password-reset:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Erreur lors de l'envoi de l'email de réinitialisation",
        details: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
