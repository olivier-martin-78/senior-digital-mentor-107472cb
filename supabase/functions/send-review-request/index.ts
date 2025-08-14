import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ReviewRequestData {
  reviewRequestId: string;
  contactEmail: string;
  contactName: string;
  contactType: 'client' | 'caregiver';
  reviewDate: string;
  city: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier l'API key Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY manquante');
      throw new Error('Configuration email manquante');
    }

    const resend = new Resend(resendApiKey);

    // Récupérer les données de la requête
    const {
      reviewRequestId,
      contactEmail,
      contactName,
      contactType,
      reviewDate,
      city,
      token
    }: ReviewRequestData = await req.json();

    console.log('📧 Envoi demande avis:', {
      reviewRequestId,
      contactEmail: contactEmail.substring(0, 3) + '***',
      contactName,
      contactType,
      reviewDate,
      city
    });

    // Construire l'URL de la page d'avis - URL mise à jour vers le domaine principal
    const baseUrl = 'https://senior-digital-mentor.com';
    const reviewUrl = `${baseUrl}/avis/${token}`;

    // Formatage de la date
    const formattedDate = new Date(reviewDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Template d'email
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Demande d'avis - Senior Digital Mentor</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Demande d'avis client</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Senior Digital Mentor</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Bonjour <strong>${contactName}</strong>,</p>
            
            <p>J'espère que vous allez bien. Je vous contacte aujourd'hui pour recueillir votre avis sur la prestation que j'ai réalisée.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">Détails de l'intervention</h3>
              <p><strong>Date :</strong> ${formattedDate}</p>
              <p><strong>Ville :</strong> ${city}</p>
              <p><strong>Type de contact :</strong> ${contactType === 'client' ? 'Client' : 'Proche aidant'}</p>
            </div>
            
            <p>Votre retour est très important pour moi et m'aide à améliorer constamment la qualité de mes services. Cela ne vous prendra que quelques minutes.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                ⭐ Donner mon avis
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              <em>Ce lien est valide pendant 7 jours. Si vous avez des questions, n'hésitez pas à me contacter directement.</em>
            </p>
            
            <p>Je vous remercie par avance pour le temps que vous consacrerez à cette évaluation.</p>
            
            <p>Bien cordialement,<br>
            Votre auxiliaire de vie</p>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
            <p>Senior Digital Mentor - Plateforme de gestion pour professionnels de l'aide à domicile</p>
          </div>
        </body>
      </html>
    `;

    // Envoyer l'email
    console.log('📤 Tentative d\'envoi email vers:', contactEmail);
    
    const result = await resend.emails.send({
      from: "Senior Digital Mentor <onboarding@resend.dev>", // Domaine vérifié par défaut
      to: [contactEmail],
      subject: "Votre avis nous intéresse - Évaluation de prestation",
      html: emailHTML
    });

    console.log('📋 Réponse complète de Resend:', JSON.stringify(result, null, 2));
    console.log('🔍 Détails result.data:', result.data);
    console.log('🔍 Détails result.error:', result.error);

    // Vérifier s'il y a une erreur dans la réponse Resend
    if (result.error) {
      console.error('❌ Erreur Resend:', result.error);
      throw new Error(`Erreur Resend: ${result.error.error || result.error.message || JSON.stringify(result.error)}`);
    }

    // Vérifier si l'email a bien été accepté (doit avoir un ID)
    if (!result.data || !result.data.id) {
      console.error('❌ Email non accepté par Resend - pas d\'ID retourné');
      console.error('❌ Data reçue:', result.data);
      throw new Error('Email non accepté par Resend - aucun ID retourné');
    }

    console.log('✅ Email envoyé avec succès:', {
      id: result.data.id,
      to: contactEmail
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demande d\'avis envoyée avec succès',
        emailId: result.data?.id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la demande d\'avis:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur inconnue'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);