
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("=== DEBUT FONCTION send-confirmation-email ===");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Requête OPTIONS reçue");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Vérification de la clé API Resend...");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY non trouvée");
      throw new Error("Configuration email manquante");
    }
    console.log("Clé API Resend trouvée");

    console.log("Lecture du corps de la requête...");
    const requestBody = await req.json();
    console.log("Corps de la requête reçu:", JSON.stringify(requestBody, null, 2));
    
    const { email, confirmationUrl, displayName } = requestBody;

    console.log("Validation des paramètres...");
    if (!email || !confirmationUrl) {
      console.error("Paramètres manquants:", { email: !!email, confirmationUrl: !!confirmationUrl });
      throw new Error("Email et URL de confirmation requis");
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Format d'email invalide:", email);
      throw new Error("Format d'email invalide");
    }
    
    console.log("Paramètres validés avec succès");

    console.log("Préparation de l'envoi email de confirmation vers:", email);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmer votre inscription</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: #218838; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue sur Senior Digital Mentor !</h1>
            </div>
            <div class="content">
              <p>Bonjour${displayName ? ` ${displayName}` : ''} !</p>
              
              <p>Merci de vous être inscrit(e) sur Senior Digital Mentor. Pour finaliser votre inscription et activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">
                  Confirmer mon adresse email
                </a>
              </div>
              
              <p>Ce lien de confirmation est valide pendant 24 heures.</p>
              
              <p>Si vous n'arrivez pas à cliquer sur le bouton, vous pouvez copier et coller ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${confirmationUrl}
              </p>
              
              <p>Si vous n'avez pas créé de compte sur Senior Digital Mentor, vous pouvez ignorer cet email.</p>
              
              <p>Cordialement,<br>L'équipe Senior Digital Mentor</p>
            </div>
            <div class="footer">
              <p>Senior Digital Mentor - Votre accompagnement numérique personnalisé</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Envoi de l'email de confirmation...");

    const emailResponse = await resend.emails.send({
      from: "Senior Digital Mentor <contact@senior-digital-mentor.com>",
      to: [email],
      subject: "Confirmez votre inscription à Senior Digital Mentor",
      html: emailHtml,
    });

    console.log("SUCCESS - Email de confirmation envoyé avec succès:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("ERREUR dans send-confirmation-email:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erreur lors de l'envoi de l'email de confirmation",
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
