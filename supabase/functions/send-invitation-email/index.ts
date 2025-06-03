
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-connection-type',
};

serve(async (req) => {
  console.log('=== DEBUT FONCTION send-invitation-email ===');
  
  if (req.method === 'OPTIONS') {
    console.log('Requête OPTIONS reçue');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Vérification de la clé API Resend...');
    if (!resendApiKey) {
      console.error('ERREUR: RESEND_API_KEY manquante dans les variables d\'environnement');
      throw new Error('Configuration manquante: RESEND_API_KEY');
    }
    console.log('Clé API Resend trouvée');

    console.log('Lecture du corps de la requête...');
    const requestBody = await req.json();
    console.log('Corps de la requête reçu:', JSON.stringify(requestBody, null, 2));
    
    const { firstName, lastName, email, inviterName, inviterEmail } = requestBody;

    console.log('Validation des paramètres...');
    if (!firstName || !lastName || !email || !inviterName || !inviterEmail) {
      console.error('Paramètres manquants:', { firstName, lastName, email, inviterName, inviterEmail });
      throw new Error('Paramètres manquants dans la requête');
    }
    console.log('Paramètres validés avec succès');

    // Email HTML avec nouvelle logique d'accès automatique
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Invitation à rejoindre Senior Digital Mentor</h2>
        
        <p>Bonjour ${firstName} ${lastName},</p>
        
        <p><strong>${inviterName}</strong> (${inviterEmail}) vous invite à rejoindre l'application Senior Digital Mentor.</p>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <p><strong>🎉 Accès complet automatique :</strong></p>
          <p>Une fois votre compte créé, vous aurez automatiquement accès en <strong>lecture</strong> à tout le contenu de ${inviterName} :</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>📝 Articles de blog</li>
            <li>📔 Entrées de journal</li>
            <li>📖 Histoire de vie</li>
            <li>⭐ Souhaits</li>
          </ul>
          <p><em>Vous pourrez également créer et gérer votre propre contenu.</em></p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Pour créer votre compte :</strong></p>
          <ol>
            <li>Rendez-vous sur <a href="https://senior-digital-mentor.com/auth">https://senior-digital-mentor.com/auth</a></li>
            <li><strong>Cliquez sur "Créer un compte"</strong></li>
            <li>Utilisez cette adresse email : <strong>${email}</strong></li>
            <li>Choisissez un mot de passe sécurisé</li>
          </ol>
        </div>
        
        <p>Une fois votre compte créé, vous devrez confirmer votre inscription à réception d'un autre mail spécifique</p>
        
        <p>Si vous avez des questions, n'hésitez pas à contacter ${inviterName} à l'adresse ${inviterEmail}.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Cet email a été envoyé automatiquement par l'application Senior Digital Mentor.
        </p>
      </div>
    `;

    console.log('Préparation de l\'envoi email vers:', email);
    console.log('URL API Resend: https://api.resend.com/emails');

    // Envoyer l'email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Senior Digital Mentor <contact@senior-digital-mentor.com>',
        to: [email],
        cc: ['contact@senior-digital-mentor.com'],
        subject: `Invitation à rejoindre Senior Digital Mentor de la part de ${inviterName}`,
        html: emailHtml,
      }),
    });

    console.log('Réponse Resend reçue - Status:', response.status);
    console.log('Headers de réponse:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERREUR Resend - Status:', response.status);
      console.error('ERREUR Resend - Réponse:', errorText);
      throw new Error(`Erreur Resend (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('SUCCESS - Email envoyé avec succès:', result);

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERREUR COMPLETE ===');
    console.error('Type d\'erreur:', typeof error);
    console.error('Message:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('Erreur complète:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur lors de l\'envoi de l\'email',
      details: error.toString(),
      type: typeof error
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
