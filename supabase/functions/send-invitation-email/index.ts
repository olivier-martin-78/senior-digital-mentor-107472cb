
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-connection-type',
};

// Rate limiting to prevent abuse
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 invitations per minute per IP

// Input sanitization function
function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .trim()
    .substring(0, 255); // Limit length for names/emails
}

serve(async (req) => {
  console.log('=== DEBUT FONCTION send-invitation-email avec sécurité renforcée ===');
  
  if (req.method === 'OPTIONS') {
    console.log('Requête OPTIONS reçue');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const userLimit = rateLimit.get(clientIP);
    
    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT_MAX) {
          console.warn(`Rate limit exceeded for IP: ${clientIP}`);
          return new Response(
            JSON.stringify({ error: 'Trop de tentatives. Veuillez réessayer plus tard.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        userLimit.count++;
      } else {
        rateLimit.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimit.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }
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

    // Sanitize all inputs
    const cleanFirstName = sanitizeInput(firstName);
    const cleanLastName = sanitizeInput(lastName);
    const cleanEmail = sanitizeInput(email);
    const cleanInviterName = sanitizeInput(inviterName);
    const cleanInviterEmail = sanitizeInput(inviterEmail);

    console.log('Validation des paramètres...');
    if (!cleanFirstName || !cleanLastName || !cleanEmail || !cleanInviterName || !cleanInviterEmail) {
      console.error('Paramètres manquants après nettoyage');
      throw new Error('Paramètres manquants dans la requête');
    }

    // Validation stricte des formats d'email et longueurs
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 254) {
      console.error('Format email invalide pour le destinataire');
      throw new Error('Format d\'email invalide pour le destinataire');
    }
    if (!emailRegex.test(cleanInviterEmail) || cleanInviterEmail.length > 254) {
      console.error('Format email invalide pour l\'inviteur');
      throw new Error('Format d\'email invalide pour l\'inviteur');
    }

    // Validation des longueurs des noms
    if (cleanFirstName.length > 50 || cleanLastName.length > 50 || 
        cleanInviterName.length > 100) {
      throw new Error('Les noms dépassent la longueur maximale autorisée');
    }
    
    console.log('Paramètres validés avec succès');

    // Email HTML avec nouvelle logique d'accès automatique et données nettoyées
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Invitation à rejoindre Senior Digital Mentor</h2>
        
        <p>Bonjour ${cleanFirstName} ${cleanLastName},</p>
        
        <p><strong>${cleanInviterName}</strong> (${cleanInviterEmail}) vous invite à rejoindre l'application Senior Digital Mentor.</p>
        
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
            <li>Utilisez cette adresse email : <strong>${cleanEmail}</strong></li>
            <li>Choisissez un mot de passe sécurisé</li>
          </ol>
        </div>
        
        <p>Une fois votre compte créé, vous devrez confirmer votre inscription à réception d'un autre mail spécifique</p>
        
        <p>Si vous avez des questions, n'hésitez pas à contacter ${cleanInviterName} à l'adresse ${cleanInviterEmail}.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Cet email a été envoyé automatiquement par l'application Senior Digital Mentor.
        </p>
      </div>
    `;

    console.log('Préparation de l\'envoi email vers:', cleanEmail);
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
        to: [cleanEmail],
        reply_to: cleanInviterEmail,
        subject: `Invitation à rejoindre Senior Digital Mentor de la part de ${cleanInviterName}`,
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
