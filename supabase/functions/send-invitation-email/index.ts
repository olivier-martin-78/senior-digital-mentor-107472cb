
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Début de la fonction send-invitation-email');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!resendApiKey) {
      console.error('RESEND_API_KEY manquante');
      throw new Error('Configuration manquante: RESEND_API_KEY');
    }

    const requestBody = await req.json();
    console.log('Corps de la requête reçu:', requestBody);
    
    const { firstName, lastName, email, inviterName, inviterEmail, accessTypes } = requestBody;

    if (!firstName || !lastName || !email || !inviterName || !inviterEmail) {
      throw new Error('Paramètres manquants dans la requête');
    }

    // Construire la liste des accès accordés
    const accessList = [];
    if (accessTypes?.blogAccess) accessList.push('Albums (Blog)');
    if (accessTypes?.wishesAccess) accessList.push('Souhaits');
    if (accessTypes?.diaryAccess) accessList.push('Journal intime');
    if (accessTypes?.lifeStoryAccess) accessList.push('Histoire de vie');

    const accessText = accessList.length > 0 
      ? `Vous avez accès aux sections suivantes : ${accessList.join(', ')}`
      : 'Aucun accès spécifique accordé pour le moment.';

    // Email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Invitation à rejoindre Tranches de Vie</h2>
        
        <p>Bonjour ${firstName} ${lastName},</p>
        
        <p><strong>${inviterName}</strong> (${inviterEmail}) vous invite à rejoindre l'application Tranches de Vie.</p>
        
        <p>${accessText}</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Pour créer votre compte :</strong></p>
          <ol>
            <li>Rendez-vous sur <a href="https://tranches-de-vie.lovable.app/auth">https://tranches-de-vie.lovable.app/auth</a></li>
            <li>Cliquez sur "Créer un compte"</li>
            <li>Utilisez cette adresse email : <strong>${email}</strong></li>
            <li>Choisissez un mot de passe sécurisé</li>
          </ol>
        </div>
        
        <p>Une fois votre compte créé, vous pourrez accéder aux sections pour lesquelles vous avez été invité(e).</p>
        
        <p>Si vous avez des questions, n'hésitez pas à contacter ${inviterName} à l'adresse ${inviterEmail}.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Cet email a été envoyé automatiquement par l'application Tranches de Vie.
        </p>
      </div>
    `;

    console.log('Envoi de l\'email vers:', email);

    // Envoyer l'email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tranches de Vie <noreply@senior-digital-mentor.com>',
        to: [email],
        cc: ['contact@senior-digital-mentor.com'],
        subject: `Invitation à rejoindre Tranches de Vie de la part de ${inviterName}`,
        html: emailHtml,
      }),
    });

    console.log('Statut de la réponse Resend:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur Resend (status:', response.status, '):', errorText);
      throw new Error(`Erreur Resend (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Email envoyé avec succès:', result);

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur complète lors de l\'envoi de l\'email:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur lors de l\'envoi de l\'email',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
