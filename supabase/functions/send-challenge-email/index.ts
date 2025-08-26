import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-connection-type',
};

// Rate limiting to prevent abuse
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 challenges per minute per IP

// Input sanitization function
function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .trim()
    .substring(0, 255);
}

serve(async (req) => {
  console.log('=== DEBUT FONCTION send-challenge-email ===');
  
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
            JSON.stringify({ error: 'Trop de défis envoyés. Veuillez réessayer plus tard.' }),
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
    
    const { 
      challengerName, 
      challengerEmail, 
      friendEmail, 
      gameType, 
      difficulty, 
      challengerScore 
    } = requestBody;

    // Sanitize all inputs
    const cleanChallengerName = sanitizeInput(challengerName);
    const cleanChallengerEmail = sanitizeInput(challengerEmail);
    const cleanFriendEmail = sanitizeInput(friendEmail);
    const cleanGameType = sanitizeInput(gameType);
    const cleanDifficulty = sanitizeInput(difficulty);

    console.log('Validation des paramètres...');
    if (!cleanChallengerName || !cleanChallengerEmail || !cleanFriendEmail || !cleanGameType || !cleanDifficulty) {
      console.error('Paramètres manquants après nettoyage');
      throw new Error('Paramètres manquants dans la requête');
    }

    // Validation stricte des formats d'email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanFriendEmail) || cleanFriendEmail.length > 254) {
      console.error('Format email invalide pour l\'ami');
      throw new Error('Format d\'email invalide pour l\'ami');
    }
    if (!emailRegex.test(cleanChallengerEmail) || cleanChallengerEmail.length > 254) {
      console.error('Format email invalide pour le challenger');
      throw new Error('Format d\'email invalide pour le challenger');
    }

    // Validation des longueurs
    if (cleanChallengerName.length > 100) {
      throw new Error('Le nom dépasse la longueur maximale autorisée');
    }
    
    console.log('Paramètres validés avec succès');

    // Définir le nom du jeu et la difficulté en français
    const gameTypeDisplay = cleanGameType === 'audio' ? 'Mémoire Auditive Inversée' : 'Mémoire Visuelle Inversée';
    const difficultyDisplay = cleanDifficulty === 'beginner' ? 'Débutant' : 
                             cleanDifficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé';

    // Construire le message de score
    const scoreMessage = challengerScore ? 
      `<p><strong>🎯 Score à battre :</strong> ${challengerScore} points en niveau ${difficultyDisplay}</p>` : 
      `<p><em>Votre ami n'a pas encore de score enregistré pour ce niveau, c'est le moment de montrer vos talents !</em></p>`;

    // Email HTML avec template de défi
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; text-align: center;">🏆 Défi Lancé !</h2>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: white; text-align: center;">
          <h3 style="margin: 0; color: white;">🧠 ${gameTypeDisplay}</h3>
          <p style="margin: 10px 0; color: white; opacity: 0.9;">Niveau ${difficultyDisplay}</p>
        </div>
        
        <p>Bonjour !</p>
        
        <p><strong>${cleanChallengerName}</strong> (${cleanChallengerEmail}) vous défie de faire un meilleur score que lui au jeu <strong>${gameTypeDisplay}</strong> !</p>
        
        ${scoreMessage}
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p><strong>🎮 Comment relever le défi :</strong></p>
          <ol>
            <li>Cliquez sur le lien ci-dessous pour accéder à la plateforme</li>
            <li>Créez votre compte ou connectez-vous</li>
            <li>Naviguez vers la section "Jeux"</li>
            <li>Lancez le jeu "${gameTypeDisplay}"</li>
            <li>Sélectionnez le niveau "${difficultyDisplay}"</li>
            <li>Battez le score de votre ami !</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://senior-digital-mentor.com/auth" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    display: inline-block;">
            🚀 Relever le défi
          </a>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>💡 À propos du jeu :</strong></p>
          <p style="margin: 5px 0;">Senior Digital Mentor propose des jeux de mémoire innovants pour stimuler vos capacités cognitives tout en vous amusant !</p>
        </div>
        
        <p>Bonne chance et amusez-vous bien ! 🎯</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Cet email a été envoyé automatiquement par l'application Senior Digital Mentor.<br>
          Si vous ne souhaitez plus recevoir de défis, contactez ${cleanChallengerEmail}.
        </p>
      </div>
    `;

    console.log('Préparation de l\'envoi email de défi vers:', cleanFriendEmail);

    // Envoyer l'email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Senior Digital Mentor <contact@senior-digital-mentor.com>',
        to: [cleanFriendEmail],
        reply_to: cleanChallengerEmail,
        subject: `🏆 ${cleanChallengerName} vous défie sur ${gameTypeDisplay} !`,
        html: emailHtml,
      }),
    });

    console.log('Réponse Resend reçue - Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERREUR Resend - Status:', response.status);
      console.error('ERREUR Resend - Réponse:', errorText);
      throw new Error(`Erreur Resend (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('SUCCESS - Email de défi envoyé avec succès:', result);

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERREUR COMPLETE ===');
    console.error('Type d\'erreur:', typeof error);
    console.error('Message:', error.message);
    console.error('Stack trace:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur lors de l\'envoi du défi',
      details: error.toString(),
      type: typeof error
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});